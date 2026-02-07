import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: { name: string } } | { params: Promise<{ name: string }> }
) {
  // compatível com Next que passa params normal ou como Promise
  const paramsAny: any = (ctx as any).params;
  const name: string | undefined =
    typeof paramsAny?.then === "function"
      ? (await paramsAny)?.name
      : paramsAny?.name;

  if (!name) {
    return NextResponse.json(
      { error: "id required", debug: { gotParams: paramsAny } },
      { status: 400 }
    );
  }

  const base = process.env.DOWNLOADER_URL;
  const token = process.env.DOWNLOADER_TOKEN;

  if (!base || !token) {
    return NextResponse.json(
      { error: "DOWNLOADER_URL / DOWNLOADER_TOKEN not set" },
      { status: 500 }
    );
  }

  const upstream = await fetch(`${base.replace(/\/$/, "")}/files/${name}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!upstream.ok) {
    const msg = await upstream.text().catch(() => "");
    return new Response(msg || "Upstream error", { status: upstream.status });
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    upstream.headers.get("content-type") || "application/octet-stream"
  );

  const cd = upstream.headers.get("content-disposition");
  if (cd) headers.set("content-disposition", cd);

  return new Response(upstream.body, { status: 200, headers });
}
