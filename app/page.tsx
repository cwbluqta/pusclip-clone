"use client";

import { useState } from "react";

export default function Home() {
  const [fileName, setFileName] = useState("audio.mp3");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testarTranscribe() {
    setLoading(true);
    setOut(null);

    try {
      // ✅ endpoint correto (existe no seu projeto): /api/transcribe
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      });

      const data = await res.json().catch(() => ({
        error: "Resposta não é JSON",
      }));

      setOut({ ok: res.ok, status: res.status, data });
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
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Teste /api/transcribe</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        Este teste chama <code>/api/transcribe</code> com <code>{"{ fileName }"}</code>.
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
        <label style={{ fontSize: 13, opacity: 0.8 }}>
          Nome do arquivo de áudio (ex: <b>audio.mp3</b>)
        </label>

        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="audio.mp3"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.18)",
            fontSize: 14,
          }}
          disabled={loading}
        />

        <button
          onClick={testarTranscribe}
          disabled={loading || !fileName.trim()}
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
          {loading ? "Transcrevendo..." : "Testar POST"}
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
        Se retornar erro dizendo que <code>fileName</code> não existe, então o endpoint espera outro campo.
        Aí você me cola o arquivo <code>app/api/transcribe/route.ts</code> que eu ajusto o body certinho.
      </div>
    </main>
  );
}
