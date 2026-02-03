const express = require("express");
const cors = require("cors");
const path = require("path");
const { ensureDirectory } = require("./lib/fs");
const { downloadRouter } = require("./routes/download");

const app = express();

const PORT = process.env.PORT || 8080;
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(__dirname, "downloads");

ensureDirectory(DOWNLOAD_DIR);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/files", express.static(DOWNLOAD_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(
  "/download",
  downloadRouter({
    downloadDir: DOWNLOAD_DIR,
    authToken: process.env.DOWNLOADER_TOKEN || "",
  })
);

app.listen(PORT, () => {
  console.log(`Downloader API listening on :${PORT}`);
});
