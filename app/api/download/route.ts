import { NextResponse } from "next/server";

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

    const r = await fetch(`${base}/download`, {
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

    return NextResponse.json({
      ok: true,
      id: data.id,
      filename: data.filename,
      // usamos o output que já existe
      fileUrl: `/api/output/${data.id}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal_error", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
