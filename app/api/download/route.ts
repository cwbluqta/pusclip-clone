import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    // URL do seu serviço downloader (Render/Railway/Fly)
    const DOWNLOADER_URL = process.env.DOWNLOADER_URL;
    const DOWNLOADER_TOKEN = process.env.DOWNLOADER_TOKEN;

    if (!DOWNLOADER_URL || !DOWNLOADER_TOKEN) {
      return NextResponse.json(
        { error: "DOWNLOADER_URL / DOWNLOADER_TOKEN não configurados na Vercel" },
        { status: 500 }
      );
    }

    const r = await fetch(`${DOWNLOADER_URL}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DOWNLOADER_TOKEN}`,
      },
      body: JSON.stringify({ url }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { error: "Downloader falhou", details: data },
        { status: 500 }
      );
    }

    // data precisa vir tipo: { ok:true, fileUrl:"https://....mp4" } ou parecido
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro interno", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
