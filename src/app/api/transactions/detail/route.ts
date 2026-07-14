export const dynamic = 'force-dynamic';

const commandApiBase =
  process.env.VOLTARIS_COMMAND_API_URL ?? 'http://127.0.0.1:9010';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const chargerId = requestUrl.searchParams.get('chargerId');
  const target = new URL(`${commandApiBase}/transactions-detail`);
  if (chargerId) target.searchParams.set('chargerId', chargerId);

  try {
    const response = await fetch(target, { cache: 'no-store' });
    const payload = await response.text();
    return new Response(payload, {
      status: response.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Transactions unavailable' },
      { status: 502 },
    );
  }
}
