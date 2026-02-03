import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "Envie um POST com { fileName } para transcrever o áudio.",
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json();

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "fileName inválido" },
        { status: 400 }
      );
    }

    const DOWNLOADER_URL = process.env.DOWNLOADER_URL;
    const DOWNLOADER_TOKEN = process.env.DOWNLOADER_TOKEN;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!DOWNLOADER_URL || !DOWNLOADER_TOKEN) {
      return NextResponse.json(
        { error: "DOWNLOADER_URL / DOWNLOADER_TOKEN não configurados na Vercel" },
        { status: 500 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurado" },
        { status: 500 }
      );
    }

    const fileUrl = `${DOWNLOADER_URL.replace(/\/$/, "")}/files/${encodeURIComponent(
      fileName
    )}`;

    const downloadResponse = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${DOWNLOADER_TOKEN}`,
      },
    });

    if (!downloadResponse.ok) {
      return NextResponse.json(
        { error: "Falha ao baixar o arquivo do downloader." },
        { status: 500 }
      );
    }

    const contentType = downloadResponse.headers.get("content-type") || undefined;
    const arrayBuffer = await downloadResponse.arrayBuffer();
    const file = await toFile(Buffer.from(arrayBuffer), fileName, {
      type: contentType,
    });

    const client = new OpenAI({ apiKey: OPENAI_API_KEY });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
    });

    return NextResponse.json({
      success: true,
      text: transcription.text,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha na transcrição", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
