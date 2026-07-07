// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ActionType,
  ResourceType,
  type ListCanReturnType,
  type OperatorCanParams,
} from '@lib/utils/access.types';
import type { AccessControlProvider, CanReturnType } from '@refinedev/core';

/**
 * Configuration options for access provider
 */
export interface AccessProviderConfig<TPermissions = unknown> {
  getPermissions: (
    params?: Record<string, any>,
  ) => Promise<TPermissions | null>;
  getUserRole: (permissions?: TPermissions) => Promise<string | undefined>;
}

/**
 * Simple role-based permission mapping
 */
export const ACCESS_CONTROL_SCOPES = [
  'Platform-wide',
  'Operator-specific',
  'Station-specific',
  'Read-only audit',
  'Temporary emergency',
] as const;

export const ROLE_PERMISSIONS = {
  'super-user': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: true,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  operator: {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  station: {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  admin: {
    // Admin has full access to everything
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: true,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  user: {
    // Customize user access as needed; for now has the same permissions as Admin
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: true,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'System Super User': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: true,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Security Administrator': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  'Platform Operations Admin': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Tariff Administrator': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  'Operator Admin': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Operations Manager': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Station Manager': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Support Agent': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  'Finance Analyst': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  'Reporting Analyst': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  'Station Technician': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Field Maintenance': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Station Viewer': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  Auditor: {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: false,
  },
  'Emergency Access User': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  'Read Only User': {
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: false,
    [ActionType.COMMAND]: false,
  },
  'Pending User': {
    [ActionType.LIST]: false,
    [ActionType.SHOW]: false,
    [ActionType.CREATE]: false,
    [ActionType.EDIT]: false,
    [ActionType.DELETE]: false,
    [ActionType.ACCESS]: false,
    [ActionType.COMMAND]: false,
  },
};

export const ACCESS_CONTROL_ROLE_OPTIONS = Object.keys(
  ROLE_PERMISSIONS,
).filter((role) => !['admin', 'user', 'super-user', 'operator', 'station'].includes(role));

export const createAccessProvider = <TPermissions = unknown>(
  config: AccessProviderConfig<TPermissions>,
): AccessControlProvider => {
  const { getPermissions, getUserRole } = config;
  const canDefault = false;
  const defaultReason = 'No explicit permissions defined';

  return {
    can: async (operatorCanParams: OperatorCanParams) => {
      const { resource, action, params } = operatorCanParams;

      const canResponse: CanReturnType | ListCanReturnType = {
        can: canDefault,
        reason: defaultReason,
      };

      const permissions = await getPermissions();

      if (!permissions) {
        return canResponse;
      }

      const userRole = await getUserRole(permissions);

      if (!userRole) {
        return {
          can: false,
          reason: 'User has no valid role assigned',
        };
      }

      const rolePermissions =
        ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];

      if (!rolePermissions) {
        return {
          can: false,
          reason: `Unknown role '${userRole}'`,
        };
      }

      const operatorDeniedResources = new Set<ResourceType>([
        ResourceType.PARTNERS,
        ResourceType.TARIFFS,
      ]);
      const stationAllowedResources = new Set<ResourceType>([
        ResourceType.CHARGING_STATIONS,
        ResourceType.CONNECTORS,
        ResourceType.TRANSACTIONS,
        ResourceType.TRANSACTION_EVENTS,
        ResourceType.METER_VALUES,
        ResourceType.OCPP_MESSAGES,
        ResourceType.STATUS_NOTIFICATIONS,
        ResourceType.EVSES,
      ]);

      if (userRole === 'operator' && operatorDeniedResources.has(resource as ResourceType)) {
        return {
          can: false,
          reason: 'Operator users cannot access platform administration resources',
        };
      }

      if (userRole === 'station' && resource && !stationAllowedResources.has(resource as ResourceType)) {
        return {
          can: false,
          reason: 'Station users can only access station-scoped resources',
        };
      }

      const hasPermission = rolePermissions[action as ActionType] === true;

      return {
        can: hasPermission,
        reason: hasPermission
          ? undefined
          : `Role '${userRole}' does not have permission for action '${action}'`,
      };
    },
  };
};
