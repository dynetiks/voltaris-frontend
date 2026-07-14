// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { CHARGING_STATIONS_LIST_QUERY } from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import { CanAccess } from '@refinedev/core';
import { useGqlCustom } from '@lib/utils/use-gql-custom';
import { heading2Style } from '@lib/client/styles/page';
import { OverviewCardSkeleton } from '@lib/client/pages/overview/overview.card.skeleton';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

const CHARGING_STATES = [
  'Charging',
  'Preparing',
  'Finishing',
  'SuspendedEV',
  'SuspendedEVSE',
  'Occupied',
];

interface StatusNotification {
  connectorStatus?: string | null;
  evseId?: number | null;
}

interface StationSummary {
  isOnline?: boolean | null;
  LatestStatusNotifications?: {
    StatusNotification?: StatusNotification | null;
  }[];
}

const getStationStatus = (
  station: StationSummary,
): 'available' | 'inUse' | 'unavailable' => {
  if (!station.isOnline) return 'unavailable';

  const statuses = (station.LatestStatusNotifications ?? [])
    .map((n) => n.StatusNotification?.connectorStatus)
    .filter(Boolean) as string[];

  if (statuses.some((s) => CHARGING_STATES.includes(s))) return 'inUse';
  if (statuses.some((s) => s === 'Available')) return 'available';
  return 'unavailable';
};

const Legend = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="text-lg font-semibold">{value}</span>
  </div>
);

const COLORS = {
  available: '#22c55e',
  inUse: '#3b82f6',
  unavailable: '#ef4444',
};

export const StationsSummaryCard = () => {
  const {
    query: { data, isLoading, error },
  } = useGqlCustom<any>({
    gqlQuery: CHARGING_STATIONS_LIST_QUERY,
    variables: { limit: 500 },
  });

  const stations: StationSummary[] = useMemo(
    () => data?.data?.ChargingStations ?? [],
    [data?.data?.ChargingStations],
  );

  const summary = useMemo(() => {
    const counts = { available: 0, inUse: 0, unavailable: 0 };
    let online = 0;
    stations.forEach((station) => {
      if (station.isOnline) online += 1;
      counts[getStationStatus(station)] += 1;
    });
    const total = stations.length;
    return {
      total,
      online,
      offline: total - online,
      onlinePct: total ? Math.round((online / total) * 100) : 0,
      offlinePct: total ? Math.round(((total - online) / total) * 100) : 0,
      ...counts,
    };
  }, [stations]);

  if (isLoading) return <OverviewCardSkeleton />;

  const pieData = [
    { name: 'Available', value: summary.available, color: COLORS.available },
    { name: 'In use', value: summary.inUse, color: COLORS.inUse },
    {
      name: 'Unavailable',
      value: summary.unavailable,
      color: COLORS.unavailable,
    },
  ];
  const hasData = summary.total > 0;

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallbackCard />}
    >
      <Card className="h-full">
        <CardHeader>
          <h2 className={heading2Style}>Charging Stations</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {error ? (
            <p className="text-muted-foreground">Unable to load data.</p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md bg-muted/40 p-4 text-center">
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-semibold">
                    {summary.total}
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Online</span>
                  <span className="text-2xl font-semibold text-success">
                    {summary.onlinePct}%
                  </span>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Offline</span>
                  <span className="text-2xl font-semibold text-destructive">
                    {summary.offlinePct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-around">
                <Legend
                  color={COLORS.available}
                  label="Available"
                  value={summary.available}
                />
                <Legend
                  color={COLORS.inUse}
                  label="In use"
                  value={summary.inUse}
                />
                <Legend
                  color={COLORS.unavailable}
                  label="Unavailable"
                  value={summary.unavailable}
                />
              </div>

              <div className="relative mx-auto h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        hasData
                          ? pieData
                          : [{ name: 'none', value: 1, color: '#e5e7eb' }]
                      }
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {(hasData
                        ? pieData
                        : [{ name: 'none', value: 1, color: '#e5e7eb' }]
                      ).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    Available
                  </span>
                  <span className="text-2xl font-semibold">
                    {summary.available}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </CanAccess>
  );
};
