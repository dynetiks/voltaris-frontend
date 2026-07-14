// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useEffect } from 'react';

function isChunkLoadError(error: Error) {
  return error.name === 'ChunkLoadError' || /Loading chunk .* failed/i.test(error.message);
}

function reportBoundaryError(error: Error & { digest?: string }, scope: string) {
  const payload = {
    type: 'react-error-boundary',
    scope,
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    timestamp: new Date().toISOString(),
  };

  void fetch('/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

export default function AuthenticatedError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportBoundaryError(error, 'authenticated');

    if (isChunkLoadError(error)) {
      const reloadKey = 'voltaris:chunk-reload';
      const hasReloaded = window.sessionStorage.getItem(reloadKey) === '1';

      if (!hasReloaded) {
        window.sessionStorage.setItem(reloadKey, '1');
        window.setTimeout(() => window.location.reload(), 250);
      }
    }
  }, [error]);

  const reloadLatestDashboard = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('_reload', Date.now().toString());
    window.location.replace(url.toString());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-lg rounded-md border border-border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Voltaris
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          Dashboard could not load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          I captured the browser error for review. You can retry after the fix is deployed.
        </p>
        <button
          type="button"
          onClick={reloadLatestDashboard}
          className="mt-5 rounded-md bg-[#26002e] px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
