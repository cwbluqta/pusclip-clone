import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST(req: Request) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const outDir = path.join(process.cwd(), "tmp", "downloads", jobId);
  await fs.mkdir(outDir, { recursive: true });

  const statusFile = path.join(outDir, "status.json");
  await fs.writeFile(statusFile, JSON.stringify({ status: "downloading" }));

  const outTemplate = path.join(outDir, "video.%(ext)s");

  const child = spawn("yt-dlp", [
    "-f", "bv*+ba/b",
    "--merge-output-format", "mp4",
    "-o", outTemplate,
    url,
  ]);

  child.on("close", async (code) => {
    if (code === 0) {
      await fs.writeFile(statusFile, JSON.stringify({ status: "done" }));
    } else {
      await fs.writeFile(
        statusFile,
        JSON.stringify({ status: "error", code })
      );
    }
  });

  return NextResponse.json({ jobId });
}
