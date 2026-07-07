// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { User } from '@lib/utils/access.types';
import config from '@lib/utils/config';

export type DashboardRole = 'super-admin' | 'operator' | 'station';

const DASHBOARD_REDIRECTS: Record<DashboardRole, string> = {
  'super-admin': '/partners?role=super-admin',
  operator: '/partners?role=operator',
  station: '/partners?role=station',
};

type GenericAuthAccount = {
  email?: string;
  password?: string;
  user: User;
};

const GENERIC_AUTH_ACCOUNTS: GenericAuthAccount[] = [
  {
    email: config.adminEmail,
    password: config.adminPassword,
    user: {
      id: '1',
      name: 'Super User',
      email: config.adminEmail,
      roles: ['admin', 'super-user'],
      accessScope: {
        tenantIds: ['*'],
        operatorIds: ['*'],
        stationIds: ['*'],
        chargerIds: ['*'],
      },
    },
  },
  {
    email: config.operatorEmail,
    password: config.operatorPassword,
    user: {
      id: '2',
      name: 'Operator User',
      email: config.operatorEmail,
      roles: ['operator'],
      accessScope: {
        tenantIds: [config.tenantId],
        operatorIds: config.operatorIds,
      },
    },
  },
  {
    email: config.stationEmail,
    password: config.stationPassword,
    user: {
      id: '3',
      name: 'Station User',
      email: config.stationEmail,
      roles: ['station'],
      accessScope: {
        tenantIds: [config.tenantId],
        operatorIds: config.stationOperatorIds,
        stationIds: config.stationIds,
        chargerIds: config.stationChargerIds,
      },
    },
  },
];

export const genericAdminUser: User = GENERIC_AUTH_ACCOUNTS[0].user;

export function authenticateGenericCredentials(
  username: string,
  password: string,
): User | null {
  const account = GENERIC_AUTH_ACCOUNTS.find(
    ({ email, password: accountPassword }) =>
      email &&
      accountPassword &&
      username === email &&
      password === accountPassword,
  );

  return account?.user ?? null;
}

export function getDashboardRedirect(roles: string[] = []): string {
  if (roles.includes('station')) {
    return DASHBOARD_REDIRECTS.station;
  }

  if (roles.includes('operator')) {
    return DASHBOARD_REDIRECTS.operator;
  }

  if (roles.includes('super-user') || roles.includes('admin')) {
    return DASHBOARD_REDIRECTS['super-admin'];
  }

  return '/overview';
}
