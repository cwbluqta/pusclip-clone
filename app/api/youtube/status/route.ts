import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "jobId obrigatório" },
      { status: 400 }
    );
  }

  const pastaDownload = path.join(
    process.cwd(),
    "tmp",
    "downloads",
    jobId
  );

  try {
    const statusRaw = await fs.readFile(
      path.join(pastaDownload, "status.json"),
      "utf-8"
    );

    const status = JSON.parse(statusRaw);

    let nomeDoArquivo: string | null = null;

    if (status.status === "done") {
      const arquivos = await fs.readdir(pastaDownload);
      const mp4 = arquivos.find((a) => a.endsWith(".mp4"));
      if (mp4) nomeDoArquivo = mp4;
    }

    return NextResponse.json({
      jobId,
      ...status,
      fileName: nomeDoArquivo,
    });
  } catch (erro) {
    return NextResponse.json({ status: "not_found" });
  }
}
