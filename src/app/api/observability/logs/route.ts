// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const dynamic = 'force-dynamic';

const openObserveUrl =
  process.env.OPENOBSERVE_URL ?? 'http://127.0.0.1:5080';
const openObserveOrg = process.env.OPENOBSERVE_ORG ?? 'default';
const openObserveStream = process.env.OPENOBSERVE_STREAM ?? 'voltaris_events';
const openObserveUser = process.env.OPENOBSERVE_USER ?? '';
const openObservePassword = process.env.OPENOBSERVE_PASSWORD ?? '';

const toTimestamp = (value: unknown) => {
  if (typeof value === 'string' && value) return value;
  if (typeof value === 'number') return new Date(value / 1000).toISOString();
  return new Date().toISOString();
};

const normalizeLog = (hit: Record<string, any>) => ({
  timestamp: toTimestamp(hit.ts ?? hit._timestamp),
  source: hit.source ?? 'OpenObserve',
  eventType: hit.event_type ?? hit.eventType ?? 'Log',
  actor: hit.actor ?? hit.service ?? 'Voltaris',
  station: hit.station ?? hit.station_id ?? 'Unknown',
  cpid: hit.cpid ?? hit.charger_id ?? 'UNKNOWN',
  messageId: hit.message_id ?? hit.messageId ?? hit.trace_id ?? 'n/a',
  action: hit.action ?? hit.event ?? hit.event_type ?? 'LogEvent',
  detail: hit.message ?? hit.detail ?? hit.error ?? 'OpenObserve event',
  severity: hit.severity ?? hit.level ?? 'Info',
  direction: hit.direction ?? 'Internal',
  auditResult: hit.audit_result ?? hit.status ?? 'Recorded',
  raw: JSON.stringify(hit),
});

export async function GET() {
  if (!openObserveUser || !openObservePassword) {
    return Response.json(
      { logs: [], error: 'OpenObserve credentials are not configured' },
      { status: 500 },
    );
  }

  const now = Date.now() * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1_000_000;
  const auth = Buffer.from(
    `${openObserveUser}:${openObservePassword}`,
  ).toString('base64');

  const response = await fetch(
    `${openObserveUrl}/api/${openObserveOrg}/_search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          sql: `select * from ${openObserveStream} order by _timestamp desc limit 200`,
          start_time: sevenDaysAgo,
          end_time: now,
        },
      }),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    return Response.json(
      { logs: [], error: detail || 'OpenObserve query failed' },
      { status: response.status },
    );
  }

  const payload = await response.json();
  const logs = Array.isArray(payload.hits)
    ? payload.hits.map((hit: Record<string, any>) => normalizeLog(hit))
    : [];

  return Response.json({
    logs,
    total: payload.total ?? logs.length,
    source: 'openobserve',
    stream: openObserveStream,
  });
}
