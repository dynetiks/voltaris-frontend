// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { getServerSession } from 'next-auth';
import authOptions from '@app/api/auth/[...nextauth]/options';
import {
  createKeycloakUser,
  listKeycloakUsers,
} from '@lib/server/keycloak/admin';

export const dynamic = 'force-dynamic';

const canManageUsers = async () => {
  const session = await getServerSession(authOptions);
  const roles = ((session?.user as any)?.roles || []) as string[];

  return roles.includes('super-user') || roles.includes('admin');
};

export async function GET() {
  if (!(await canManageUsers())) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const users = await listKeycloakUsers();
    return Response.json({ users });
  } catch (error) {
    return Response.json(
      {
        users: [],
        error:
          error instanceof Error ? error.message : 'Unable to load users',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await canManageUsers())) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const userRole = String(body.userRole || '').trim();
    const temporaryPassword = String(body.temporaryPassword || '');

    if (!name || !email || !userRole || !temporaryPassword) {
      return Response.json(
        { error: 'Name, email, role, and temporary password are required' },
        { status: 400 },
      );
    }

    const user = await createKeycloakUser({
      name,
      email,
      userRole,
      temporaryPassword,
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to create user',
      },
      { status: 500 },
    );
  }
}
