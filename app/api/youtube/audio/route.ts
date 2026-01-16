import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST(req: Request) {
  const { jobId, fileName } = await req.json();

  if (!jobId || !fileName) {
    return NextResponse.json(
      { error: "jobId e fileName são obrigatórios" },
      { status: 400 }
    );
  }

  const pasta = path.join(process.cwd(), "tmp", "downloads", jobId);
  const videoPath = path.join(pasta, fileName);

  const audioName = "audio.mp3";
  const audioPath = path.join(pasta, audioName);

  try {
    await fs.access(videoPath);
  } catch {
    return NextResponse.json(
      { error: "Vídeo não encontrado" },
      { status: 404 }
    );
  }

  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-i", videoPath,
      "-vn",
      "-ac", "1",
      "-ar", "16000",
      "-b:a", "64k",
      audioPath,
    ]);

    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("FFmpeg falhou"));
    });
  });

  return NextResponse.json({
    status: "done",
    jobId,
    audioFileName: audioName,
  });
}
