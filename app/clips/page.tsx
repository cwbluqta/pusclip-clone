"use client";

import React, { useMemo, useState } from "react";

type Clip = {
  id: string;
  start: number;
  end: number;
  score?: number;
  text?: string;
};

function fmt(sec: number) {
  const s = Math.max(0, sec);
  return `${s.toFixed(2)}s`;
}

export default function ClipsPage() {
  const [currentFile, setCurrentFile] = useState<string>("video.mp4");
  const [uploading, setUploading] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Clips iniciais (igual seu print)
  const [clips, setClips] = useState<Clip[]>([
    {
      id: "1",
      start: 0,
      end: 40,
      score: 49.11,
      text:
        "Hoje eu vou te mostrar como ganhar dinheiro na internet... (texto exemplo)",
    },
  ]);

  const duration = useMemo(() => {
    if (!clips.length) return 0;
    return clips.reduce((acc, c) => Math.max(acc, c.end - c.start), 0);
  }, [clips]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Envia para /api/upload (se existir no seu projeto)
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      // Se /api/upload não existir ou retornar HTML, vai quebrar aqui -> mostramos erro
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Falha no upload");
        return;
      }

      const fileName =
        data?.fileName || data?.filename || data?.name || data?.inputFile;

      if (!fileName) {
        alert("Upload ok, mas não veio fileName do servidor.");
        return;
      }

      setCurrentFile(fileName);

      // Tenta buscar highlights automaticamente (se existir)
      // Se seu /api/highlights tiver outro formato, não tem problema: só não atualiza.
      try {
        const h = await fetch("/api/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputFile: fileName }),
        });

        const hd = await h.json();

        // Aceita alguns formatos comuns
        const arr: any[] =
          hd?.clips || hd?.data?.clips || hd?.highlights || hd?.data || [];

        if (Array.isArray(arr) && arr.length) {
          const normalized: Clip[] = arr.map((x, i) => ({
            id: String(x.id ?? i + 1),
            start: Number(x.start ?? x.s ?? 0),
            end: Number(x.end ?? x.e ?? 0),
            score: x.score != null ? Number(x.score) : undefined,
            text: x.text ?? x.caption ?? x.transcript ?? "",
          }));
          setClips(normalized.filter((c) => c.end > c.start));
        }
      } catch {
        // sem highlights? segue com os clips atuais
      }
    } catch (err: any) {
      alert(err?.message ?? "Erro no upload");
    } finally {
      setUploading(false);
      // permite escolher o mesmo arquivo de novo
      e.target.value = "";
    }
  }

  async function exportarCorte(clip: Clip) {
    try {
      setExportingId(clip.id);

      const res = await fetch("/api/cut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputFile: currentFile,
          start: clip.start,
          end: clip.end,
        }),
      });

      // Se der 404/500 e vier HTML, isso evita aquele erro de JSON inválido
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!res.ok) {
        alert(data?.error ?? text ?? "Falha ao exportar corte");
        return;
      }

      const url = data?.url;
      if (!url) {
        alert("Cortou, mas não veio a URL do arquivo. (Esperado: data.url)");
        return;
      }

      // abre o MP4 gerado
      window.open(url, "_blank");
    } catch (err: any) {
      alert(err?.message ?? "Erro ao exportar");
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Clips (Base OpusClip)</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Aqui aparecem os melhores cortes com start/end/score. Depois a gente pluga
        vídeo e exportação.
      </p>

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Upload de vídeo</h2>
        <input type="file" accept="video/*" onChange={handleUpload} />
        <div style={{ marginTop: 8, color: "#444" }}>
          Arquivo atual: <b>{currentFile}</b>{" "}
          {uploading ? <span style={{ marginLeft: 8 }}>(enviando...)</span> : null}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {clips.map((c, idx) => (
          <div
            key={c.id}
            style={{
              padding: 16,
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              #{idx + 1}{" "}
              <span style={{ fontWeight: 400, marginLeft: 8 }}>
                {fmt(c.start)} → {fmt(c.end)}{" "}
                <span style={{ marginLeft: 10 }}>
                  {(c.end - c.start).toFixed(2)}s
                </span>
                {typeof c.score === "number" ? (
                  <span style={{ marginLeft: 10 }}>score {c.score.toFixed(2)}</span>
                ) : null}
              </span>
            </div>

            {c.text ? (
              <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{c.text}</p>
            ) : (
              <p style={{ marginTop: 0, color: "#666" }}>(sem texto)</p>
            )}

            <button
              onClick={() => exportarCorte(c)}
              disabled={!!exportingId}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #222",
                background: exportingId === c.id ? "#eee" : "#fff",
                cursor: exportingId ? "not-allowed" : "pointer",
              }}
            >
              {exportingId === c.id ? "Exportando..." : "Exportar corte"}
            </button>
          </div>
        ))}

        {!clips.length ? (
          <div style={{ color: "#666" }}>Nenhum clip ainda.</div>
        ) : null}
      </div>
    </div>
  );
}
