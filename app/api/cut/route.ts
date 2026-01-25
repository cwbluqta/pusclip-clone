// app/api/cut/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export const runtime = "nodejs";

function runFFmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: "pipe" });

    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));

    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `FFmpeg saiu com código ${code}`));
    });
  });
}

export async function POST(req: Request) {
  try {
    const { inputFile, start, end } = await req.json();

    if (!inputFile || typeof start !== "number" || typeof end !== "number") {
      return NextResponse.json(
        { error: "Envie { inputFile, start, end }" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "end precisa ser maior que start" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "storage", "uploads");
    const outputsDir = path.join(process.cwd(), "storage", "outputs");
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

    const inPath = path.join(uploadsDir, inputFile);
    if (!fs.existsSync(inPath)) {
      return NextResponse.json(
        { error: `Arquivo não encontrado: ${inputFile}` },
        { status: 404 }
      );
    }

    const outName = `${Date.now()}_${start.toFixed(2)}_${end.toFixed(2)}.mp4`;
    const outPath = path.join(outputsDir, outName);

    // ✅ RE-ENCODE SEMPRE (acaba com vídeo colorido/bugado)
    await runFFmpeg([
      "-y",
      "-ss",
      String(start),
      "-to",
      String(end),
      "-i",
      inPath,

      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",

      "-c:a",
      "aac",
      "-b:a",
      "128k",

      outPath,
    ]);

    return NextResponse.json({
      ok: true,
      outputFile: outName,
      url: `/api/output/${outName}`,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Erro no corte" },
      { status: 500 }
    );
  }
}
