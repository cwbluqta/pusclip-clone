import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST() {
  const inputPath = path.join(process.cwd(), "videos", "video.mp4");
  const outputPath = path.join(process.cwd(), "videos", "audio.mp3");

  if (!fs.existsSync(inputPath)) {
    return NextResponse.json(
      { error: "video.mp4 não encontrado em /videos" },
      { status: 400 }
    );
  }

  // Extrai áudio e salva como MP3
  const cmd = `ffmpeg -y -i "${inputPath}" -vn -ac 1 -ar 16000 -b:a 64k "${outputPath}"`;

  return await new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve(
          NextResponse.json(
            { error: "Falhou ao converter para áudio", details: String(stderr || stdout || error.message) },
            { status: 500 }
          )
        );
        return;
      }

      resolve(
        NextResponse.json({
          success: true,
          path: "/videos/audio.mp3",
        })
      );
    });
  });
}
