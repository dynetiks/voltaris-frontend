// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const dynamic = 'force-dynamic';

const dashboardUrl =
  process.env.VOLTARIS_DASHBOARD_URL ?? 'http://127.0.0.1:9010/dashboard';

export async function GET() {
  try {
    const response = await fetch(dashboardUrl, { cache: 'no-store' });
    const payload = await response.json();

    return Response.json(payload, { status: response.status });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard summary',
      },
      { status: 502 },
    );
  }
}
