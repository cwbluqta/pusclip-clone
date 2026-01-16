"use client";

import { useEffect, useState } from "react";

type Clip = {
  start: number;
  end: number;
  duration: number;
  score: number;
  text: string;
};

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
const [inputFile, setInputFile] = useState<string>("video.mp4");
const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: [
              { start: 0, end: 6, text: "Hoje eu vou te mostrar como ganhar dinheiro na internet." },
              { start: 6, end: 14, text: "Pouca gente fala sobre isso, mas existe um erro que quase todo iniciante comete." },
              { start: 14, end: 26, text: "Se você evitar esse erro, suas chances aumentam muito." },
              { start: 26, end: 40, text: "E no final do vídeo eu vou te mostrar uma dica prática." }
            ]
          })
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Erro ao gerar cortes");

        setClips(json.clips ?? []);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Clips (Base OpusClip)</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        Aqui aparecem os melhores cortes com start/end/score. Depois a gente pluga vídeo e exportação.
      </p>
<div
  style={{
    marginBottom: 16,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
  }}
>
  <b>Upload de vídeo</b>

  <div
    style={{
      marginTop: 8,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >
    <input
      type="file"
      accept="video/mp4,video/*"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setUploading(true);
        try {
          const fd = new FormData();
          fd.append("file", f);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: fd,
          });
          const json = await res.json();

          if (!res.ok)
            throw new Error(json?.error ?? "Falha no upload");

          setInputFile(json.fileName);
          alert("Upload OK! Arquivo: " + json.fileName);
        } catch (err: any) {
          alert("Erro no upload: " + err.message);
        } finally {
          setUploading(false);
        }
      }}
    />

    <span style={{ opacity: 0.8 }}>
      {uploading ? "Enviando..." : `Arquivo atual: ${inputFile}`}
    </span>
  </div>
</div>

      {loading && <p>Gerando cortes…</p>}
      {err && <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>}

      {!loading && !err && clips.length === 0 && <p>Nenhum corte apareceu.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {clips.map((c, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 14
            }}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <b>#{i + 1}</b>
              <span>⏱ {c.start.toFixed(2)}s → {c.end.toFixed(2)}s</span>
              <span>📏 {c.duration.toFixed(2)}s</span>
              <span>🔥 score {c.score.toFixed(2)}</span>
            </div>

            <div style={{ opacity: 0.9, lineHeight: 1.4 }}>
              {c.text}
            </div>
            <button
  onClick={async () => {
    try {
      const res = await fetch("/api/cut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputFile: "video.mp4",
          start: c.start,
          end: c.end,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        alert("Corte exportado! Veja em storage/outputs");
      } else {
        alert("Erro ao exportar: " + (json.error ?? "desconhecido"));
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  }}
  style={{
    marginTop: 10,
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  }}
>
  Exportar corte
</button>

          </div>
        ))}
      </div>
    </div>
  );
}
