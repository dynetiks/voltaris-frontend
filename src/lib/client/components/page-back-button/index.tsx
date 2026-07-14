// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const HIDE_BACK_ROUTES = new Set(['/overview']);

export const PageBackButton = () => {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || HIDE_BACK_ROUTES.has(pathname)) return null;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/overview');
  };

  return (
    <div className="pt-5">
      <button
        type="button"
        onClick={handleBack}
        className="group inline-flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/95 px-2.5 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#26002e]/25 hover:bg-card hover:shadow-md active:scale-[0.98]"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted/80 text-foreground transition-colors duration-200 group-hover:bg-[#26002e] group-hover:text-white">
          <ChevronLeft className="size-4" strokeWidth={2.25} />
        </span>
        <span className="pr-1 tracking-tight">Back</span>
      </button>
    </div>
  );
};
