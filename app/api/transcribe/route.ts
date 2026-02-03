// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

export const runtime = "nodejs";

const TMP_DOWNLOAD_DIR = path.join("/tmp", "opusclip-downloads");

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

    const safeName = path.basename(fileName);
    const audioPath = path.join(TMP_DOWNLOAD_DIR, safeName);

    if (!fs.existsSync(audioPath)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado em /tmp" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "gpt-4o-mini-transcribe",
    });

    // ✅ NA VERCEL NÃO PODE SALVAR EM ARQUIVO (filesystem read-only)
    // então só retornamos o texto
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
