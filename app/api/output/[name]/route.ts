export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  const { name } = params;

  const base = process.env.DOWNLOADER_URL;
  const token = process.env.DOWNLOADER_TOKEN;

  if (!base || !token) {
    return new Response("DOWNLOADER_URL / DOWNLOADER_TOKEN not set", {
      status: 500,
    });
  }

  if (!name) {
    return new Response("id required", { status: 400 });
  }

  const upstream = await fetch(`${base}/files/${name}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!upstream.ok) {
    const msg = await upstream.text();
    return new Response(msg, { status: upstream.status });
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  const cd = upstream.headers.get("content-disposition");

  if (ct) headers.set("content-type", ct);
  if (cd) headers.set("content-disposition", cd);

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
