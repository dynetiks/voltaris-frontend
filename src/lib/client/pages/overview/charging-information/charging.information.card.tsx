// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { CHARGING_INFORMATION_SUMMARY_QUERY } from '@lib/queries/transactions';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';
import { CanAccess } from '@refinedev/core';
import { useGqlCustom } from '@lib/utils/use-gql-custom';
import { ChevronRightIcon, BatteryCharging, Zap, CircleCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { heading2Style } from '@lib/client/styles/page';
import { overviewClickableStyle } from '@lib/client/styles/card';
import { OverviewCardSkeleton } from '@lib/client/pages/overview/overview.card.skeleton';

const Row = ({
  icon,
  iconBg,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  note: string;
}) => (
  <div className="flex items-center gap-3 rounded-md border border-border p-3">
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-md ${iconBg}`}
    >
      {icon}
    </div>
    <div className="flex flex-1 flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
    <span className="text-sm text-muted-foreground">{note}</span>
  </div>
);

export const ChargingInformationCard = () => {
  const { push } = useRouter();

  const {
    query: { data, isLoading, error },
  } = useGqlCustom<any>({
    gqlQuery: CHARGING_INFORMATION_SUMMARY_QUERY,
  });

  const activeCount = data?.data?.active?.aggregate?.count ?? 0;
  const completedCount = data?.data?.completed?.aggregate?.count ?? 0;
  const totalEnergy = data?.data?.energy?.aggregate?.sum?.totalKwh ?? 0;

  if (isLoading) return <OverviewCardSkeleton />;

  return (
    <CanAccess
      resource={ResourceType.TRANSACTIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallbackCard />}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className={heading2Style}>Charging information</h2>
            <div
              className={overviewClickableStyle}
              onClick={() => push(`/${MenuSection.TRANSACTIONS}`)}
            >
              History <ChevronRightIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error ? (
            <p className="text-muted-foreground">Unable to load data.</p>
          ) : (
            <>
              <Row
                icon={<BatteryCharging className="size-5 text-secondary" />}
                iconBg="bg-secondary/15"
                label="Active sessions"
                value={String(activeCount)}
                note={activeCount === 0 ? 'No sessions yet' : ''}
              />
              <Row
                icon={<Zap className="size-5 text-orange-500" />}
                iconBg="bg-orange-500/15"
                label="Total energy"
                value={`${Number(totalEnergy).toFixed(1)} kWh`}
                note={totalEnergy === 0 ? 'No sessions yet' : ''}
              />
              <Row
                icon={<CircleCheck className="size-5 text-success" />}
                iconBg="bg-success/15"
                label="Completed sessions"
                value={String(completedCount)}
                note={completedCount === 0 ? 'No sessions yet' : ''}
              />
            </>
          )}
        </CardContent>
      </Card>
    </CanAccess>
  );
};
