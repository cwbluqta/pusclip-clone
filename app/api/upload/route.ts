// app/api/upload/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Envie um arquivo no campo 'file'." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "storage", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const name = `${Date.now()}_${safeName}`;
    const outPath = path.join(uploadsDir, name);

    fs.writeFileSync(outPath, buffer);

    return NextResponse.json({ ok: true, fileName: name });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Erro no upload" }, { status: 500 });
  }
}
