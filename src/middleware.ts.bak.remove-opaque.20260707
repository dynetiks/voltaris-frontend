// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Server-side authentication middleware.
 *
 * Uses next-auth/jwt getToken() to validate the encrypted session cookie on
 * every matched request before any page renders or server action executes.
 * Unauthenticated requests are redirected to /login. Requests whose token
 * refresh failed (Keycloak session ended) are redirected with an error param.
 *
 * Protected: all routes except /login, /api/auth/**, /api/health, and
 * Next.js internal paths / static assets (see matcher below).
 */
const opaqueRouteAliases: Record<string, string> = {
  ch_8KQ2M7:
    '/partners?role=operator&section=daily-operations&action=charger-dashboard&cpid=13074934',
  vx_admin_logs:
    '/partners?role=super-admin&section=oversight&action=diagnostics-logs',
  vx_admin_operators:
    '/partners?role=super-admin&section=platform-operations&action=tenant-operator-management',
  vx_create_operator:
    '/partners?role=super-admin&section=platform-operations&action=create-operator',
  vx_modify_operator_wafienergy:
    '/partners?role=super-admin&section=platform-operations&action=modify-operator&operatorId=wafienergy',
  vx_admin_stations:
    '/partners?role=super-admin&section=platform-operations&action=station-registry',
  vx_create_station:
    '/partners?role=super-admin&section=platform-operations&action=create-station',
  vx_modify_station_battlex:
    '/partners?role=super-admin&section=platform-operations&action=modify-station&stationId=BattleX',
  vx_admin_chargers:
    '/partners?role=super-admin&section=platform-operations&action=charger-registry',
  vx_create_charger:
    '/partners?role=super-admin&section=platform-operations&action=create-charger',
  vx_modify_charger_13074934:
    '/partners?role=super-admin&section=platform-operations&action=modify-charger&cpid=13074934',
  vx_admin_firmware:
    '/partners?role=super-admin&section=platform-operations&action=firmware',
  vx_operator_fleet:
    '/partners?role=operator&section=fleet-setup&action=station-management',
  vx_operator_analytics:
    '/partners?role=operator&section=daily-operations&action=reporting-and-analytics',
  vx_battlex_charger:
    '/partners?role=operator&section=daily-operations&action=charger-dashboard&cpid=13074934',
  vx_station_dashboard:
    '/partners?role=station&section=live-status&action=station-status',
};

export async function middleware(request: NextRequest) {
  const opaqueMatch = request.nextUrl.pathname.match(/^\/(?:r|d)\/([^/]+)$/);
  const opaqueTarget = opaqueMatch ? opaqueRouteAliases[opaqueMatch[1]] : null;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // skip server side auth for generic auth provider
  if (
    !process.env.NEXT_PUBLIC_AUTH_PROVIDER ||
    process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'generic'
  ) {
    if (opaqueTarget) {
      return NextResponse.rewrite(new URL(opaqueTarget, request.url));
    }

    return NextResponse.next();
  }

  // No valid session — redirect to login
  if (!token) {
    console.debug('No token found, redirecting to /login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token refresh failed (e.g. Keycloak SSO session expired) — force re-login
  if (token.error === 'RefreshAccessTokenError') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'SessionExpired');
    return NextResponse.redirect(loginUrl);
  }

  if (opaqueTarget) {
    return NextResponse.rewrite(new URL(opaqueTarget, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   /login                  – the unauthenticated login page
     *   /api/auth/**            – NextAuth sign-in / callback / sign-out endpoints
     *   /api/health             – public health-check (load balancers, probes)
     *   /_next/static/**        – Next.js compiled assets
     *   /_next/image/**         – Next.js image optimisation endpoint
     *   /favicon.ico            – browser favicon
     *   /<file>.<ext>           – any root-level static file (svg, png, etc.)
     */
    '/((?!login|api/auth|api/health|_next/static|_next/image|favicon\\.ico|[^/]+\\.[^/]+$).*)',
  ],
};
