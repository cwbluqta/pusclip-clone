"use client";

import { useEffect, useState } from "react";

export default function TestHighlights() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
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
        setData(json);
      } catch (e: any) {
        setError(e.message);
      }
    }

    run();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Teste Highlights</h1>

      {error && <pre style={{ color: "red" }}>{error}</pre>}

      {!data && !error && <p>Rodando teste…</p>}

      {data && (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
