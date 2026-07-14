export const dynamic = 'force-dynamic';

const commandApiBase =
  process.env.VOLTARIS_COMMAND_API_URL ?? 'http://127.0.0.1:9010';

async function proxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = `${commandApiBase}/registry/${path.map(encodeURIComponent).join('/')}`;
  const body = ['POST', 'PUT', 'PATCH'].includes(request.method)
    ? await request.text()
    : undefined;

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body,
      cache: 'no-store',
    });
    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Registry unavailable' },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
