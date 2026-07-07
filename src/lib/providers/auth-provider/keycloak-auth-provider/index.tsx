// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import {
  type AuthenticationContextProvider,
  type User,
} from '@/lib/utils/access.types';
import config from '@/lib/utils/config';
import { getSession, signIn, signOut } from 'next-auth/react';
import type { AuthProvider } from '@refinedev/core';
import { HasuraHeader, HasuraRole } from '@lib/utils/hasura.types';
import { Button } from '@lib/client/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { parseJwt, getTokenClaim } from '@lib/utils/jwt';

export enum KeycloakRole {
  ADMIN = 'admin',
  SUPER_USER = 'super-user',
  OPERATOR = 'operator',
  STATION = 'station',
  USER = 'user',
}

/**
 * Extended user identity with Keycloak-specific fields
 */
export interface KeycloakUserIdentity extends User {
  tenantId?: string;
  avatar?: string;
}

export interface KeycloakPermissions {
  roles: string[];
  tenants?: string[];
  resources?: Record<string, string[]>;
}

const HASURA_CLAIM = config.hasuraClaim!;

const LOGIN_SCENE_IMAGE = '/images/login/voltaris-login-scene.png';
const LOGIN_LOGO_IMAGE = '/images/login/logo.png';

/**
 * Keycloak Login Page Component
 * Keeps the Voltaris-branded entry page while delegating identity to Keycloak.
 */
const KeycloakLoginPage: React.FC = () => {
  const [sceneImageFailed, setSceneImageFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn('keycloak', { callbackUrl: '/partners' });
  };

  return (
    <div className="flex min-h-screen bg-[#060912]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0b1633] lg:block lg:w-[60%]">
        {!sceneImageFailed ? (
          <Image
            src={LOGIN_SCENE_IMAGE}
            alt="Voltaris EV charging"
            fill
            className="object-cover object-center"
            onError={() => setSceneImageFailed(true)}
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/50">
            Voltaris
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060912]/30 via-transparent to-[#060912]/20" />

        <div className="pointer-events-none absolute left-8 top-3 z-10 sm:left-10 sm:top-4">
          <Image
            src={LOGIN_LOGO_IMAGE}
            alt="Voltaris"
            width={560}
            height={144}
            className="h-auto w-[320px] max-w-[65vw] object-contain object-left sm:w-[440px] lg:w-[560px]"
            priority
          />
        </div>
      </section>

      <section className="flex min-h-screen w-full flex-col justify-center bg-[#060912] px-8 py-8 sm:px-10 lg:w-[40%] lg:px-12">
        <div className="mx-auto w-full max-w-[540px]">
          <div className="mb-12 text-center">
            <h1 className="text-[2.75rem] font-semibold leading-tight text-white">
              Sign in to Voltaris CSMS
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/45">
              EV Charging Station Management System
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="h-12 w-full rounded-lg bg-[#2563eb] text-[15px] font-medium text-white shadow-none hover:bg-[#1d4ed8]"
          >
            {isLoading ? 'Opening secure sign in...' : 'Continue'}
          </Button>

          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-white/35">
            <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>Secure access to your charging network</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export const createKeycloakAuthProvider = (): AuthProvider &
  AuthenticationContextProvider => {
  const getPermissions = async (): Promise<KeycloakPermissions> => {
    const session = await getSession();
    if (!session?.user) {
      return { roles: [], tenants: [], resources: {} };
    }

    const roles = (session.user as any).roles || [];
    return {
      roles,
      tenants: [],
      resources: {},
    };
  };

  const getUserRole = async (): Promise<string | undefined> => {
    const permissions = await getPermissions();
    const roles = permissions.roles;

    if (roles && roles.length > 0) {
      if (
        roles.includes(KeycloakRole.SUPER_USER) ||
        roles.includes(KeycloakRole.ADMIN)
      ) {
        return KeycloakRole.SUPER_USER;
      }
      if (roles.includes(KeycloakRole.OPERATOR)) {
        return KeycloakRole.OPERATOR;
      }
      if (roles.includes(KeycloakRole.STATION)) {
        return KeycloakRole.STATION;
      }
      if (roles.includes(KeycloakRole.USER)) {
        return KeycloakRole.USER;
      }
    }
    return undefined;
  };

  const getHasuraHeaders = async (): Promise<Map<HasuraHeader, string>> => {
    const hasuraHeaders = new Map<HasuraHeader, string>();
    const session = await getSession();
    if (!session) {
      return hasuraHeaders;
    }
    const token = (session as any).accessToken;
    if (!token) {
      return hasuraHeaders;
    }
    const tokenParsed = parseJwt(token);

    // Set Hasura role
    const hasuraClaims = getTokenClaim(tokenParsed, HASURA_CLAIM);
    if (!hasuraClaims) {
      const permissions = await getPermissions();
      const roles = permissions.roles;

      if (roles && roles.length > 0 && roles.includes(KeycloakRole.ADMIN)) {
        hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.ADMIN);
      } else {
        hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.USER);
      }
    }

    // Set Hasura tenant ID
    const tenantId = tokenParsed.tenantId;
    if (tenantId) {
      hasuraHeaders.set(HasuraHeader.X_HASURA_TENANT_ID, tenantId);
    }

    return hasuraHeaders;
  };

  const getToken = async (): Promise<string | undefined> => {
    const session = await getSession();
    return (session as any)?.accessToken;
  };

  return {
    login: async ({ redirectTo }) => {
      await signIn('keycloak', { callbackUrl: redirectTo || '/partners' });
      return { success: true };
    },
    logout: async ({ redirectTo }) => {
      const session = await getSession();
      const idToken = (session as any)?.idToken;
      const keycloakLogoutUrl = (session as any)?.keycloakLogoutUrl;

      // Clear the NextAuth session cookie without triggering a redirect
      await signOut({ redirect: false });

      // Redirect the browser to Keycloak's end-session endpoint so it can
      // clear its own SSO cookie. Without this, Keycloak silently re-authenticates
      // the user on the next check because the browser-side SSO session is still live.
      if (idToken && keycloakLogoutUrl) {
        const postLogoutUri = `${window.location.origin}${redirectTo || '/login'}`;
        const params = new URLSearchParams({
          id_token_hint: idToken,
          post_logout_redirect_uri: postLogoutUri,
        });
        window.location.href = `${keycloakLogoutUrl}?${params.toString()}`;
        return { success: true };
      }

      return { success: true, redirectTo: redirectTo || '/login' };
    },
    check: async () => {
      const session = await getSession();
      if (!session) {
        return { authenticated: false, logout: true, redirectTo: '/login' };
      }
      // Check if token refresh failed
      if ((session as any).error === 'RefreshAccessTokenError') {
        return { authenticated: false, logout: true, redirectTo: '/login' };
      }
      return { authenticated: true };
    },
    getIdentity: async () => {
      const session = await getSession();
      if (!session?.user) return null;

      return {
        id: (session.user as any).sub || '1',
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        roles: (session.user as any).roles || [],
        tenantId: (session.user as any).tenantId,
      } as User;
    },
    getPermissions,
    onError: async (error) => {
      console.error('Auth error:', error);

      // Only logout for auth errors
      if (error.statusCode === 401) {
        return { logout: true };
      }

      return { error };
    },

    // AuthenticationContextProvider methods
    getToken,
    getUserRole,
    getHasuraHeaders,
    getInitialized: async (): Promise<boolean> => true,
    getLoginPage: () => KeycloakLoginPage,
  };
};
