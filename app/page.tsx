"use client";

import { useState } from "react";

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl =
    (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
      ?.VITE_API_BASE_URL ?? "";

  const downloadEndpoint = apiBaseUrl
    ? `${apiBaseUrl}/api/download`
    : "/api/download";
  const transcribeEndpoint = apiBaseUrl
    ? `${apiBaseUrl}/api/transcribe`
    : "/api/transcribe";

  async function baixarETranscrever() {
    setLoading(true);
    setOut(null);

    try {
      const downloadRes = await fetch(downloadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const downloadData = await downloadRes.json().catch(() => ({
        error: "Resposta não é JSON",
      }));

      if (!downloadRes.ok) {
        setOut({
          step: "download",
          ok: false,
          status: downloadRes.status,
          data: downloadData,
        });
        return;
      }

      const nextFileName = downloadData?.fileName;
      if (!nextFileName) {
        setOut({
          step: "download",
          ok: false,
          error: "fileName não retornado pelo /api/download.",
          data: downloadData,
        });
        return;
      }

      setFileName(nextFileName);

      const transcribeRes = await fetch(transcribeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: nextFileName }),
      });

      const transcribeData = await transcribeRes.json().catch(() => ({
        error: "Resposta não é JSON",
      }));

      setOut({
        step: "transcribe",
        ok: transcribeRes.ok,
        status: transcribeRes.status,
        download: downloadData,
        transcribe: transcribeData,
      });
    } catch (err: any) {
      setOut({ ok: false, error: err?.message ?? String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        Teste /api/download → /api/transcribe
      </h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        Este fluxo chama <code>/api/download</code> com <code>{"{ url }"}</code> e,
        em seguida, <code>/api/transcribe</code> com <code>{"{ fileName }"}</code>.
      </p>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 16,
          padding: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
        }}
      >
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.18)",
            fontSize: 14,
          }}
          disabled={loading}
        />

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Base URL atual: <code>{apiBaseUrl || "mesma origem (Vercel)"}</code>
        </div>

        <label style={{ fontSize: 13, opacity: 0.8 }}>
          Arquivo baixado (preenchido após o download)
        </label>

        <input
          value={fileName}
          readOnly
          placeholder="download-xxxx.mp4"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            fontSize: 14,
            background: "rgba(0,0,0,0.04)",
          }}
        />

        <button
          onClick={baixarETranscrever}
          disabled={loading || !youtubeUrl.trim()}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.18)",
            background: loading ? "rgba(0,0,0,0.08)" : "black",
            color: loading ? "black" : "white",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Baixando e transcrevendo..." : "Baixar e transcrever"}
        </button>
      </div>

      <pre
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "rgba(0,0,0,0.06)",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {out ? JSON.stringify(out, null, 2) : "Sem resultado ainda"}
      </pre>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
        O download é feito pelo serviço externo e retorna o <code>fileName</code> para
        ser usado pela transcrição.
      </div>
    </main>
  );
}
