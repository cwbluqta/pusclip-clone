"use client";

import { useState } from "react";

export default function Home() {
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testar() {
    setLoading(true);
    setOut(null);

    const res = await fetch("/api/youtube/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: "audio.mp3" }),
    });

    const data = await res.json().catch(() => ({ error: "Resposta não é JSON" }));
    setOut({ status: res.status, data });
    setLoading(false);
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Teste Transcribe</h1>

      <button onClick={testar} disabled={loading} style={{ padding: 12 }}>
        {loading ? "Transcrevendo..." : "Testar POST"}
      </button>

      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>
        {out ? JSON.stringify(out, null, 2) : "Sem resultado ainda"}
      </pre>
    </main>
  );
}
