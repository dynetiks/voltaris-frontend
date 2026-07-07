// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import config from '@lib/utils/config';

const keycloakServerUrl = config.keycloakServerUrl || config.keycloakUrl;

type KeycloakUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
  createdTimestamp?: number;
};

type KeycloakRole = {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
};

const requiredConfig = () => {
  const username = process.env.KEYCLOAK_ADMIN_USERNAME;
  const password = process.env.KEYCLOAK_ADMIN_PASSWORD;

  if (
    !keycloakServerUrl ||
    !config.keycloakRealm ||
    !config.keycloakClientId ||
    !username ||
    !password
  ) {
    throw new Error('Keycloak admin configuration is incomplete');
  }

  return {
    baseUrl: keycloakServerUrl.replace(/\/$/, ''),
    realm: config.keycloakRealm,
    clientId: config.keycloakClientId,
    username,
    password,
  };
};

const requestJson = async <T>(
  url: string,
  init: RequestInit,
  expectedStatus?: number,
) => {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
  });

  if (expectedStatus && response.status === expectedStatus) {
    return undefined as T;
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Keycloak request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const getAdminToken = async () => {
  const { baseUrl, username, password } = requiredConfig();
  const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;

  const response = await requestJson<{ access_token: string }>(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: 'admin-cli',
      grant_type: 'password',
      username,
      password,
    }),
  });

  return response.access_token;
};

const adminHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getClientUuid = async (token: string) => {
  const { baseUrl, realm, clientId } = requiredConfig();
  const clients = await requestJson<Array<{ id: string; clientId: string }>>(
    `${baseUrl}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`,
    {
      headers: adminHeaders(token),
    },
  );
  const client = clients.find((item) => item.clientId === clientId);

  if (!client) {
    throw new Error(`Keycloak client ${clientId} was not found`);
  }

  return client.id;
};

const getClientRole = async (
  token: string,
  clientUuid: string,
  roleName: string,
) => {
  const { baseUrl, realm } = requiredConfig();
  const roleUrl = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles/${encodeURIComponent(roleName)}`;
  const response = await fetch(roleUrl, {
    headers: adminHeaders(token),
    cache: 'no-store',
  });

  if (response.status === 404) {
    await requestJson<void>(
      `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles`,
      {
        method: 'POST',
        headers: adminHeaders(token),
        body: JSON.stringify({
          name: roleName,
          description: `Voltaris ${roleName} access role`,
        }),
      },
      201,
    );

    return requestJson<KeycloakRole>(roleUrl, {
      headers: adminHeaders(token),
    });
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Unable to load role ${roleName}`);
  }

  return (await response.json()) as KeycloakRole;
};

export const listKeycloakUsers = async () => {
  const token = await getAdminToken();
  const { baseUrl, realm } = requiredConfig();
  const clientUuid = await getClientUuid(token);
  const users = await requestJson<KeycloakUser[]>(
    `${baseUrl}/admin/realms/${realm}/users?max=200`,
    {
      headers: adminHeaders(token),
    },
  );

  const mappedUsers = await Promise.all(
    users.map(async (user) => {
      const roles = user.id
        ? await requestJson<KeycloakRole[]>(
            `${baseUrl}/admin/realms/${realm}/users/${user.id}/role-mappings/clients/${clientUuid}`,
            {
              headers: adminHeaders(token),
            },
          )
        : [];
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

      return {
        id: user.id,
        name: name || user.username || user.email || 'Unnamed user',
        email: user.email || '',
        username: user.username || '',
        roles: roles.map((role) => role.name).sort(),
        status: user.enabled === false ? 'Disabled' : 'Active',
        lastLogin: user.createdTimestamp
          ? `Created ${new Date(user.createdTimestamp).toLocaleDateString()}`
          : 'Not available',
      };
    }),
  );

  return mappedUsers.sort((a, b) => a.email.localeCompare(b.email));
};

export const createKeycloakUser = async (input: {
  name: string;
  email: string;
  userRole: string;
  temporaryPassword: string;
}) => {
  const token = await getAdminToken();
  const { baseUrl, realm } = requiredConfig();
  const clientUuid = await getClientUuid(token);
  const [firstName, ...lastNameParts] = input.name.trim().split(/\s+/);

  const existingUsers = await requestJson<KeycloakUser[]>(
    `${baseUrl}/admin/realms/${realm}/users?username=${encodeURIComponent(input.email)}&exact=true`,
    {
      headers: adminHeaders(token),
    },
  );

  if (existingUsers.length > 0) {
    throw new Error('A Keycloak user with this email already exists');
  }

  const createResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({
      username: input.email,
      email: input.email,
      firstName: firstName || input.email,
      lastName: lastNameParts.join(' '),
      enabled: true,
      emailVerified: true,
    }),
    cache: 'no-store',
  });

  if (createResponse.status !== 201) {
    const detail = await createResponse.text();
    throw new Error(detail || `Unable to create user (${createResponse.status})`);
  }

  const location = createResponse.headers.get('location') || '';
  const userId = location.split('/').pop();

  if (!userId) {
    throw new Error('Keycloak did not return the created user id');
  }

  await requestJson<void>(
    `${baseUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
    {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify({
        type: 'password',
        value: input.temporaryPassword,
        temporary: true,
      }),
    },
    204,
  );

  const role = await getClientRole(token, clientUuid, input.userRole);

  await requestJson<void>(
    `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`,
    {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify([role]),
    },
    204,
  );

  return { id: userId };
};
