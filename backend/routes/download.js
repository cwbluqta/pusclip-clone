const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { ensureDirectory } = require("../lib/fs");

function buildYtDlpArgs({ url, outputTemplate, mode }) {
  const baseArgs = [
    "--no-playlist",
    "--no-progress",
    "--restrict-filenames",
    "--newline",
    "-o",
    outputTemplate,
    url,
  ];

  if (mode === "audio") {
    return [
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      ...baseArgs,
    ];
  }

  return [
    "-f",
    "bv*+ba/best",
    "--merge-output-format",
    "mp4",
    ...baseArgs,
  ];
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
    });
  });
}

function downloadRouter({ downloadDir, authToken }) {
  return async (req, res) => {
    if (authToken) {
      const header = req.headers.authorization || "";
      const token = header.replace(/^Bearer\s+/i, "");
      if (token !== authToken) {
        res.status(401).json({ ok: false, error: "Token inválido." });
        return;
      }
    }

    const { url, mode = "video" } = req.body || {};
    if (!url || typeof url !== "string") {
      res.status(400).json({ ok: false, error: "URL inválida." });
      return;
    }

    ensureDirectory(downloadDir);

    const jobId = crypto.randomUUID();
    const outputTemplate = path.join(
      downloadDir,
      `${jobId}-%(title).80s-%(id)s.%(ext)s`
    );

    try {
      const args = buildYtDlpArgs({ url, outputTemplate, mode });
      await runYtDlp(args);

      const files = await fs.readdir(downloadDir);
      const matchingFiles = files.filter((file) => file.startsWith(jobId));
      if (!matchingFiles.length) {
        res.status(500).json({ ok: false, error: "Nenhum arquivo gerado." });
        return;
      }

      res.json({ fileName: matchingFiles[0] });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Falha ao baixar o vídeo.",
        details: error.message,
      });
    }
  };
}

module.exports = { downloadRouter };
