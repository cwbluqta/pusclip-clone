// app/api/output/[name]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await ctx.params;
    const safeName = decodeURIComponent(name);

    // trava contra path traversal
    if (
      !safeName ||
      safeName.includes("..") ||
      safeName.includes("/") ||
      safeName.includes("\\")
    ) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "storage", "outputs", safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Arquivo não encontrado", filePath },
        { status: 404 }
      );
    }

    const stat = fs.statSync(filePath);
    const file = fs.readFileSync(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Erro ao servir arquivo" },
      { status: 500 }
    );
  }
}
