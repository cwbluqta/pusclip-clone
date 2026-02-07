import { NextResponse } from "next/server";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { url, format = "mp3" } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    const base = process.env.DOWNLOADER_URL;
    const token = process.env.DOWNLOADER_TOKEN;

    if (!base || !token) {
      return NextResponse.json(
        { error: "DOWNLOADER_URL / DOWNLOADER_TOKEN not set" },
        { status: 500 }
      );
    }

    const baseUrl = base.replace(/\/$/, "");
    const r = await fetch(`${baseUrl}/api/download`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, format }),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(data, { status: r.status });
    }

    const fileUrl = new URL(`/api/output/${data.id}`, req.url).toString();

    return NextResponse.json({
      ok: true,
      id: data.id,
      filename: data.filename,
      // usamos o output que já existe
      fileUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal_error", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
