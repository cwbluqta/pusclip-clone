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

    const outPath = path.join(process.cwd(), "videos", "transcription.txt");
    fs.writeFileSync(outPath, transcription.text, "utf8");

    return NextResponse.json({
      success: true,
      text: transcription.text,
      savedAs: "/videos/transcription.txt",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha na transcrição", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
