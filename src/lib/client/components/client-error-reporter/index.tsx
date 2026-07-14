// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useEffect } from 'react';

const serializeReason = (reason: unknown) => {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    };
  }

  if (typeof reason === 'string') {
    return { message: reason };
  }

  try {
    return { message: JSON.stringify(reason) };
  } catch {
    return { message: String(reason) };
  }
};

const reportClientError = (payload: Record<string, unknown>) => {
  const body = JSON.stringify({
    ...payload,
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    timestamp: new Date().toISOString(),
  });

  if (window.navigator.sendBeacon) {
    window.navigator.sendBeacon(
      '/api/client-error',
      new Blob([body], { type: 'application/json' }),
    );
    return;
  }

  void fetch('/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  });
};

export function ClientErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError({
        type: 'error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: serializeReason(event.error),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientError({
        type: 'unhandledrejection',
        error: serializeReason(event.reason),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
