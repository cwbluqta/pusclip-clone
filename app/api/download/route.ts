import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    const base = process.env.DOWNLOADER_URL;
    const token = process.env.DOWNLOADER_TOKEN;

    if (!base) {
      return NextResponse.json(
        { error: "missing env DOWNLOADER_URL" },
        { status: 500 }
      );
    }
    if (!token) {
      return NextResponse.json(
        { error: "missing env DOWNLOADER_TOKEN" },
        { status: 500 }
      );
    }

    const r = await fetch(`${base}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    const text = await r.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(
      { ok: r.ok, status: r.status, from: "downloader", data },
      { status: r.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "api/download crashed", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
