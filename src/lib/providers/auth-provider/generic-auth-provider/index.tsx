// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Alert, AlertDescription } from '@lib/client/components/ui/alert';
import { Button } from '@lib/client/components/ui/button';
import { Input } from '@lib/client/components/ui/input';
import { Label } from '@lib/client/components/ui/label';
import {
  type AuthenticationContextProvider,
  type User,
} from '@lib/utils/access.types';
import config from '@lib/utils/config';
import { HasuraHeader, HasuraRole } from '@lib/utils/hasura.types';
import { useLogin, type AuthProvider } from '@refinedev/core';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { getDashboardRedirect } from './generic-auth-users';

/**
 * Configuration for the auth provider
 */
export interface GenericAuthProviderConfig {
  tokenKey?: string;
  userKey?: string;
}

const TENANT_ID = config.tenantId;

/**
 * Custom Login Page — email and password only; dashboard is chosen from credentials.
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: login, isPending: isLoading } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    login(
      { email, password },
      {
        onError: (loginError) => {
          setError(loginError?.message || 'Invalid email or password');
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen bg-[#060912]">
      {/* Left branding panel */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0b1633] lg:block lg:w-[60%]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.45),transparent_32%),radial-gradient(circle_at_70%_65%,rgba(38,0,46,0.95),transparent_42%),linear-gradient(135deg,#060912_0%,#0b1633_45%,#26002e_100%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060912]/10 via-transparent to-[#060912]/35" />

        <div className="pointer-events-none absolute left-8 top-6 z-10 sm:left-10">
          <div className="text-4xl font-semibold lowercase tracking-[-0.03em] text-white sm:text-5xl">
            voltaris
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-white/45">
            EV Charging CSMS
          </div>
        </div>

        <div className="absolute bottom-14 left-10 max-w-xl text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">
            Intelligence in motion
          </p>
          <h2 className="mt-4 text-5xl font-semibold leading-tight">
            Monitor chargers, sessions, and network health in one place.
          </h2>
        </div>
      </section>

      {/* Right login panel */}
      <section className="flex min-h-screen w-full flex-col justify-center bg-[#060912] px-8 py-8 sm:px-10 lg:w-[40%] lg:px-12">
        <div className="mx-auto w-full max-w-[540px]">
          <div className="mb-20 text-center">
            <h1 className="text-[2.75rem] font-semibold leading-tight text-white">
              Sign in to Voltaris CSMS
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/45">
              EV Charging Station Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-normal text-white/70">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-white/30" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-12 rounded-lg border-white/12 bg-[#0c1018] pl-11 text-[15px] text-white shadow-none placeholder:text-white/28 focus-visible:border-[#3b82f6]/50 focus-visible:ring-[#3b82f6]/30"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-normal text-white/70">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-white/30" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-12 rounded-lg border-white/12 bg-[#0c1018] pl-11 pr-11 text-[15px] text-white shadow-none placeholder:text-white/28 focus-visible:border-[#3b82f6]/50 focus-visible:ring-[#3b82f6]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/55"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                className="text-sm text-[#3b82f6] hover:text-[#60a5fa]"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-lg bg-[#2563eb] text-[15px] font-medium text-white shadow-none hover:bg-[#1d4ed8]"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-white/35">
            <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span>Secure access to your charging network</span>
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * Creates a default permissive auth provider that uses localStorage
 * for persistence and always grants permissions
 */
export const createGenericAuthProvider = (
  config: GenericAuthProviderConfig = {},
): AuthProvider & AuthenticationContextProvider => {
  const { tokenKey = 'auth_token', userKey = 'auth_user' } = config;
  /**
   * Save token to storage
   */
  const saveToken = (token: string): void => {
    localStorage.setItem(tokenKey, token);
  };

  /**
   * Get token from storage
   */
  const getToken = async (): Promise<string | undefined> => {
    return localStorage.getItem(tokenKey) || undefined;
  };

  /**
   * Save user to storage
   */
  const saveUser = (user: User): void => {
    localStorage.setItem(userKey, JSON.stringify(user));
  };

  /**
   * Get user from storage
   */
  const getUser = (): User | null => {
    const userStr = localStorage.getItem(userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      return null;
    }
  };

  /**
   * Get permissions
   */
  const getPermissions = async () => {
    const user = getUser();
    return {
      roles: user?.roles || [],
    };
  };

  const getUserRole = async (): Promise<string | undefined> => {
    const roles = (await getPermissions()).roles;

    if (!roles || roles.length === 0) {
      return undefined;
    }

    if (roles.includes('station')) {
      return 'station';
    }

    if (roles.includes('operator')) {
      return 'operator';
    }

    if (roles.includes('super-user') || roles.includes(HasuraRole.ADMIN)) {
      return 'super-user';
    }

    return HasuraRole.USER;
  };

  /**
   * Get the Hasura role from the identity
   */
  const getHasuraHeaders = async (): Promise<Map<HasuraHeader, string>> => {
    const hasuraHeaders = new Map<HasuraHeader, string>();

    const roles = (await getPermissions()).roles;
    if (roles && roles.length > 0 && roles.includes(HasuraRole.ADMIN)) {
      hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.ADMIN);
    } else {
      hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.USER);
    }

    hasuraHeaders.set(HasuraHeader.X_HASURA_TENANT_ID, TENANT_ID);

    return hasuraHeaders;
  };

  // Return the auth provider implementation
  return {
    login: async ({ email, password }) => {
      const result = await signIn('generic', {
        username: email,
        password,
        redirect: false,
      });

      if (!result || result.error || !result.ok) {
        return {
          success: false,
          error: {
            message: 'Login failed',
            name: 'Invalid email or password',
          },
        };
      }

      const session = await getSession();
      const sessionUser = session?.user as
        | (User & { sub?: string })
        | undefined;
      const roles = sessionUser?.roles || [];
      const authenticatedUser: User = {
        id: sessionUser?.sub || sessionUser?.id || '1',
        name: sessionUser?.name || 'User',
        email: sessionUser?.email || email,
        roles,
      };

      const mockToken = 'mock_token_' + Math.random().toString(36).slice(2);
      saveToken(mockToken);
      saveUser(authenticatedUser);

      const redirectTo = getDashboardRedirect(roles);

      window.location.href = redirectTo;
      return {
        success: true,
        redirectTo,
      };
    },

    logout: async () => {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);

      return {
        success: true,
        redirectTo: '/login',
      };
    },

    check: async () => {
      const token = await getToken();

      console.log('🔐 Auth check - token exists:', !!token);

      if (token) {
        return {
          authenticated: true,
        };
      }

      console.warn('❌ Not authenticated, should redirect to /login');
      return {
        authenticated: false,
        redirectTo: '/login',
        logout: true,
        error: {
          message: 'Not authenticated',
          name: 'Authentication Error',
        },
      };
    },

    onError: async (error) => {
      console.log(`Authprovider: onError triggered, error: ${error}`);
      // Only logout for auth errors, not schema validation errors
      if (error.statusCode === 401) {
        return {
          logout: true,
        };
      }

      // For other errors, just return an error without logging out
      return {
        error: {
          message: error.message,
          name: error.name,
        },
      };
    },

    getIdentity: async () => {
      const user = getUser();
      if (!user) return null;
      return user;
    },

    getPermissions,

    // AuthenticationContextProvider methods

    getToken,
    getUserRole,
    getHasuraHeaders,
    getInitialized: async (): Promise<boolean> => true,
    getLoginPage: () => LoginPage,
  };
};

export { genericAdminUser } from './generic-auth-users';
