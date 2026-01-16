import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    const outputPath = path.join(process.cwd(), "videos", "video.mp4");

    // Comando: baixa MP4 no caminho escolhido
    const cmd = `yt-dlp -f mp4 -o "${outputPath}" "${url}"`;

    return await new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          resolve(
            NextResponse.json(
              {
                error: "Falhou ao baixar o vídeo",
                details: String(stderr || stdout || error.message),
              },
              { status: 500 }
            )
          );
          return;
        }

        resolve(
          NextResponse.json({
            success: true,
            path: "/videos/video.mp4",
          })
        );
      });
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro interno", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
