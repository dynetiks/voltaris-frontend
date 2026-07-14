// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@lib/client/components/ui/tabs';
import { TRANSACTIONS_ENERGY_QUERY } from '@lib/queries/transactions';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import { CanAccess } from '@refinedev/core';
import { useGqlCustom } from '@lib/utils/use-gql-custom';
import { heading2Style } from '@lib/client/styles/page';
import { OverviewCardSkeleton } from '@lib/client/pages/overview/overview.card.skeleton';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

type RangeKey = '24h' | '30d' | '1y';

const RANGES: { key: RangeKey; label: string; ms: number; buckets: number }[] =
  [
    { key: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000, buckets: 24 },
    { key: '30d', label: '30 days', ms: 30 * 24 * 60 * 60 * 1000, buckets: 30 },
    { key: '1y', label: '1 year', ms: 365 * 24 * 60 * 60 * 1000, buckets: 12 },
  ];

interface EnergyTx {
  id: number;
  totalKwh?: number | null;
  createdAt?: string | null;
}

const formatBucketLabel = (date: Date, range: RangeKey): string => {
  if (range === '24h')
    return date.toLocaleTimeString([], { hour: '2-digit' });
  if (range === '30d')
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return date.toLocaleDateString([], { month: 'short' });
};

export const StatisticsCard = () => {
  const [range, setRange] = useState<RangeKey>('24h');

  const {
    query: { data, isLoading, error },
  } = useGqlCustom<any>({
    gqlQuery: TRANSACTIONS_ENERGY_QUERY,
  });

  const transactions: EnergyTx[] = useMemo(
    () => data?.data?.Transactions ?? [],
    [data?.data?.Transactions],
  );

  const { chartData, totalEnergy } = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range)!;
    const now = Date.now();
    const since = now - cfg.ms;
    const bucketMs = cfg.ms / cfg.buckets;

    const buckets = Array.from({ length: cfg.buckets }, (_, i) => ({
      label: formatBucketLabel(new Date(since + i * bucketMs), range),
      kWh: 0,
    }));

    let total = 0;
    transactions.forEach((tx) => {
      if (!tx.createdAt) return;
      const t = new Date(tx.createdAt).getTime();
      if (Number.isNaN(t) || t < since || t > now) return;
      const kwh = Number(tx.totalKwh) || 0;
      const idx = Math.min(
        cfg.buckets - 1,
        Math.floor((t - since) / bucketMs),
      );
      buckets[idx].kWh += kwh;
      total += kwh;
    });

    return { chartData: buckets, totalEnergy: total };
  }, [transactions, range]);

  if (isLoading) return <OverviewCardSkeleton />;

  const hasData = totalEnergy > 0;

  return (
    <CanAccess
      resource={ResourceType.TRANSACTIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallbackCard />}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className={heading2Style}>Statistics</h2>
            <Tabs
              value={range}
              onValueChange={(v) => setRange(v as RangeKey)}
            >
              <TabsList>
                {RANGES.map((r) => (
                  <TabsTrigger key={r.key} value={r.key}>
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="text-muted-foreground">Unable to load data.</p>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Total Energy Usage
                </span>
                <span className="text-2xl font-semibold">
                  {totalEnergy.toFixed(1)} kWh
                </span>
              </div>
              <div className="h-48 w-full">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="energyFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(1)} kWh`,
                          'Energy',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="kWh"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#energyFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No charging sessions in this period.
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </CanAccess>
  );
};
