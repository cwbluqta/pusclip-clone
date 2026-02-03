import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import crypto from "crypto";

export const runtime = "nodejs";

const TMP_DOWNLOAD_DIR = path.join("/tmp", "opusclip-downloads");

function extensionFromContentType(contentType: string | null) {
  if (!contentType) return "";
  if (contentType.includes("audio/mpeg")) return ".mp3";
  if (contentType.includes("audio/mp4")) return ".m4a";
  if (contentType.includes("video/mp4")) return ".mp4";
  if (contentType.includes("video/webm")) return ".webm";
  return "";
}

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "Envie um POST com { url } para baixar o vídeo no backend.",
    },
    { status: 200 }
  );
}

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

    const fileUrl = data?.fileUrl;
    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Downloader não retornou fileUrl." },
        { status: 500 }
      );
    }

    await mkdir(TMP_DOWNLOAD_DIR, { recursive: true });

    const downloadResponse = await fetch(fileUrl);
    if (!downloadResponse.ok || !downloadResponse.body) {
      return NextResponse.json(
        { error: "Falha ao baixar o arquivo remoto." },
        { status: 500 }
      );
    }

    const urlPath = new URL(fileUrl).pathname;
    const extFromUrl = path.extname(urlPath);
    const extFromHeader = extensionFromContentType(
      downloadResponse.headers.get("content-type")
    );
    const extension = extFromUrl || extFromHeader || ".mp4";
    const fileName = `download-${crypto.randomUUID()}${extension}`;
    const filePath = path.join(TMP_DOWNLOAD_DIR, fileName);

    await pipeline(
      Readable.fromWeb(downloadResponse.body),
      createWriteStream(filePath)
    );

    return NextResponse.json({
      ok: true,
      fileName,
      filePath,
      sourceUrl: fileUrl,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro interno", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
