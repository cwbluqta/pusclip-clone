// app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST() {
  try {
    const audioPath = path.join(process.cwd(), "videos", "audio.mp3");

    if (!fs.existsSync(audioPath)) {
      return NextResponse.json(
        { error: "audio.mp3 não encontrado em /videos" },
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
