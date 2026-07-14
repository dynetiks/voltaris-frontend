// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { CHARGING_STATIONS_LIST_QUERY } from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import { CanAccess } from '@refinedev/core';
import { useGqlCustom } from '@lib/utils/use-gql-custom';
import { ChevronRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { heading2Style } from '@lib/client/styles/page';
import { overviewClickableStyle } from '@lib/client/styles/card';
import { OverviewCardSkeleton } from '@lib/client/pages/overview/overview.card.skeleton';
import { cn } from '@lib/utils/cn';

interface StationListItem {
  id: number;
  ocppConnectionName: string;
  isOnline?: boolean | null;
  protocol?: string | null;
  chargePointVendor?: string | null;
  location?: { name?: string | null } | null;
}

export const ChargingStationsListCard = () => {
  const { push } = useRouter();

  const {
    query: { data, isLoading, error },
  } = useGqlCustom<any>({
    gqlQuery: CHARGING_STATIONS_LIST_QUERY,
    variables: { limit: 50, order_by: [{ updatedAt: 'desc' }] },
  });

  const stations: StationListItem[] = data?.data?.ChargingStations ?? [];

  if (isLoading) return <OverviewCardSkeleton />;

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallbackCard />}
    >
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className={heading2Style}>Charging Stations</h2>
            <div
              className={overviewClickableStyle}
              onClick={() => push(`/${MenuSection.CHARGING_STATIONS}`)}
            >
              View all <ChevronRightIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {error ? (
            <p className="text-muted-foreground">Unable to load stations.</p>
          ) : stations.length === 0 ? (
            <p className="text-muted-foreground">No charging stations yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                  onClick={() =>
                    push(`/${MenuSection.CHARGING_STATIONS}/${station.id}`)
                  }
                >
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold">
                      {station.ocppConnectionName}
                    </span>
                    {station.location?.name && (
                      <span className="text-sm text-muted-foreground">
                        {station.location.name}
                      </span>
                    )}
                    <div className="flex gap-8 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Vendor</span>
                        <span>{station.chargePointVendor || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Protocol</span>
                        <span>{station.protocol || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'border-transparent',
                      station.isOnline
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/15 text-destructive',
                    )}
                  >
                    {station.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </CanAccess>
  );
};
