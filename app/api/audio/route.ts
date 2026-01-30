export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST() {
  try {
    // Caminhos absolutos
    const videosDir = path.join(process.cwd(), "videos");
    const inputPath = path.join(videosDir, "video.mp4");
    const outputPath = path.join(videosDir, "audio.mp3");

    // Garante que a pasta existe
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    // Verifica se o vídeo existe
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json(
        { error: "video.mp4 não encontrado na pasta /videos" },
        { status: 400 }
      );
    }

    // Comando FFmpeg
    const cmd = `ffmpeg -y -i "${inputPath}" -vn -ac 1 -ar 16000 -b:a 64k "${outputPath}"`;

    // Executa FFmpeg
    await new Promise<void>((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || stdout || error.message);
          return;
        }
        resolve();
      });
    });

    // Retorno de sucesso
    return NextResponse.json({
      success: true,
      audio: "/videos/audio.mp3",
    });

  } catch (err) {
    return NextResponse.json(
      {
        error: "Erro ao extrair áudio",
        details: String(err),
      },
      { status: 500 }
    );
  }
}
