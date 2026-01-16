import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName é obrigatório" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY não encontrada" }, { status: 500 });
    }

    const filePath = path.join(process.cwd(), "public", fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "arquivo não encontrado", filePath }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath) as any,
      model: "whisper-1",
    });

    return NextResponse.json({
      status: "done",
      text: result.text,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "erro interno", detail: String(err) },
      { status: 500 }
    );
  }
}
