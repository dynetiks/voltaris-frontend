// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useEffect } from 'react';

function reportGlobalError(error: Error & { digest?: string }) {
  const payload = {
    type: 'global-react-error-boundary',
    scope: 'global',
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportGlobalError(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center font-sans">
          <div className="max-w-lg rounded-md border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Voltaris
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              The browser error has been captured for review.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-md bg-[#26002e] px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
