// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    payload = { error: 'Unable to parse client error payload' };
  }

  console.error('Voltaris client-side exception', JSON.stringify(payload, null, 2));

  return NextResponse.json({ ok: true });
}
