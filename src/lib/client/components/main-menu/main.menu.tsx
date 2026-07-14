// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Logo } from '@lib/client/components/title';
import { cn } from '@lib/utils/cn';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EvCharger,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { useGetIdentity } from '@refinedev/core';
import type { User } from '@lib/utils/access.types';
import { sidebarIconSize } from '@lib/client/styles/icon';

export enum MenuSection {
  OVERVIEW = 'overview',
  LOCATIONS = 'locations',
  CHARGING_STATIONS = 'charging-stations',
  AUTHORIZATIONS = 'authorizations',
  TRANSACTIONS = 'transactions',
  TARIFFS = 'tariffs',
  PARTNERS = 'partners',
}

export interface MainMenuProps {
  activeSection: MenuSection;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface MenuChildItem {
  label: string;
  action: string;
}

interface MenuChildSection {
  label: string;
  section: string;
  items: MenuChildItem[];
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  role: string;
  sections?: MenuChildSection[];
}

// Slugs mirror partners.list.tsx getSectionSlug/getItemSlug output.
const SUPER_ADMIN_SECTIONS: MenuChildSection[] = [
  {
    label: 'Oversight',
    section: 'oversight',
    items: [
      { label: 'Dashboard', action: 'dashboard' },
      { label: 'Monitoring', action: 'call-monitoring' },
      { label: 'Transactions', action: 'transactions' },
    ],
  },
  {
    label: 'Platform Operations',
    section: 'platform-operations',
    items: [
      { label: 'Operators', action: 'tenant-operator-management' },
      { label: 'Stations & Chargers', action: 'stations-and-chargers' },
      { label: 'Firmware', action: 'firmware' },
    ],
  },
  {
    label: 'Access',
    section: 'access-control',
    items: [{ label: 'Users', action: 'user-roles' }],
  },
  {
    label: 'Tariff',
    section: 'tariff',
    items: [{ label: 'Tariffs', action: 'tariffs' }],
  },
];

const OPERATOR_SECTIONS: MenuChildSection[] = [
  {
    label: 'Daily Operations',
    section: 'daily-operations',
    items: [{ label: 'Dashboard', action: 'dashboard' }],
  },
  {
    label: 'Fleet',
    section: 'fleet-setup',
    items: [{ label: 'Stations & Chargers', action: 'stations-and-chargers' }],
  },
  {
    label: 'Team',
    section: 'people-and-access',
    items: [{ label: 'Team Members', action: 'team-members' }],
  },
];

const STATION_SECTIONS: MenuChildSection[] = [
  {
    label: 'Live Status',
    section: 'live-status',
    items: [{ label: 'Dashboard', action: 'dashboard' }],
  },
];

const buildRoleHref = (role: string, section: string, action: string) =>
  `/${MenuSection.PARTNERS}?role=${role}&section=${section}&action=${action}`;

const getDefaultSection = (role: string) => {
  if (role === 'operator') return OPERATOR_SECTIONS[0].section;
  if (role === 'station') return STATION_SECTIONS[0].section;
  return SUPER_ADMIN_SECTIONS[0].section;
};

const getRoleAccent = (role: string) => {
  switch (role) {
    case 'super-admin':
      return {
        roleText: 'text-violet-700',
        roleActiveBg: 'bg-violet-50',
        sectionText: 'text-violet-600/80',
        itemText: 'text-slate-600',
        itemActiveText: 'text-violet-700',
        itemActiveBg: 'bg-violet-50',
        bar: 'bg-violet-600',
        guide: 'border-violet-200',
      };
    case 'operator':
      return {
        roleText: 'text-blue-700',
        roleActiveBg: 'bg-blue-50',
        sectionText: 'text-blue-600/80',
        itemText: 'text-slate-600',
        itemActiveText: 'text-blue-700',
        itemActiveBg: 'bg-blue-50',
        bar: 'bg-blue-600',
        guide: 'border-blue-200',
      };
    case 'station':
      return {
        roleText: 'text-emerald-700',
        roleActiveBg: 'bg-emerald-50',
        sectionText: 'text-emerald-600/80',
        itemText: 'text-slate-600',
        itemActiveText: 'text-emerald-700',
        itemActiveBg: 'bg-emerald-50',
        bar: 'bg-emerald-600',
        guide: 'border-emerald-200',
      };
    default:
      return {
        roleText: 'text-foreground',
        roleActiveBg: 'bg-accent',
        sectionText: 'text-muted-foreground',
        itemText: 'text-muted-foreground',
        itemActiveText: 'text-primary',
        itemActiveBg: 'bg-primary/10',
        bar: 'bg-primary',
        guide: 'border-border/50',
      };
  }
};

export const MainMenu = ({
  activeSection,
  collapsed,
  onCollapsedChange,
}: MainMenuProps) => {
  const menuRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: identity } = useGetIdentity<User>();
  const roles = identity?.roles ?? [];
  const allowedRole = roles.includes('station')
    ? 'station'
    : roles.includes('operator')
      ? 'operator'
      : 'super-admin';
  const requestedRole = searchParams.get('role') ?? allowedRole;
  const activeRole = allowedRole === 'super-admin' ? requestedRole : allowedRole;
  const activeRoleSection =
    searchParams.get('section') ?? getDefaultSection(activeRole);
  const activeAction = searchParams.get('action');
  const [openRoles, setOpenRoles] = useState<Record<string, boolean>>(() => ({
    [activeRole]: true,
  }));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCollapsedChange(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCollapsedChange]);

  useEffect(() => {
    if (['super-admin', 'operator', 'station'].includes(activeRole)) {
      setOpenRoles({ [activeRole]: true });
    }
  }, [activeRole]);

  const toggleRoleSections = (role: string) => {
    setOpenRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const menuItems: MenuItem[] = [
    {
      href: buildRoleHref(
        'super-admin',
        SUPER_ADMIN_SECTIONS[0].section,
        SUPER_ADMIN_SECTIONS[0].items[0].action,
      ),
      label: 'Super Admin',
      icon: <ShieldCheck className={sidebarIconSize} />,
      role: 'super-admin',
      sections: SUPER_ADMIN_SECTIONS,
    },
    {
      href: buildRoleHref(
        'operator',
        OPERATOR_SECTIONS[0].section,
        OPERATOR_SECTIONS[0].items[0].action,
      ),
      label: 'Operator',
      icon: <UserCog className={sidebarIconSize} />,
      role: 'operator',
      sections: OPERATOR_SECTIONS,
    },
    {
      href: buildRoleHref(
        'station',
        STATION_SECTIONS[0].section,
        STATION_SECTIONS[0].items[0].action,
      ),
      label: 'Station',
      icon: <EvCharger className={sidebarIconSize} />,
      role: 'station',
      sections: STATION_SECTIONS,
    },
  ];

  const visibleMenuItems =
    allowedRole === 'station'
      ? menuItems.filter((item) => item.role === 'station')
      : allowedRole === 'operator'
        ? menuItems.filter((item) => item.role === 'operator')
        : menuItems;

  const renderRoleSections = (item: MenuItem) => {
    if (!item.sections || collapsed || !openRoles[item.role]) {
      return null;
    }

    return (
      <div className="mb-4 mt-3 space-y-5 border-t border-border/40 pt-4 pl-1">
        {item.sections.map((section, sectionIndex) => {
          const isSectionActive =
            activeRole === item.role && activeRoleSection === section.section;

          return (
            <div
              key={section.section}
              className={cn(sectionIndex > 0 && 'pt-1')}
            >
              <p className="mb-2.5 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                {section.label}
              </p>
              <ul className="space-y-1 border-l-2 border-border/60 pl-3">
                {section.items.map((child, childIndex) => {
                  const isChildActive =
                    isSectionActive &&
                    (activeAction
                      ? activeAction === child.action
                      : childIndex === 0);

                  return (
                    <li key={child.action} className="relative">
                      {isChildActive && (
                        <span className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground/70" />
                      )}
                      <Link
                        href={buildRoleHref(
                          item.role,
                          section.section,
                          child.action,
                        )}
                        className={cn(
                          'block rounded-md px-2.5 py-2 text-[13px] leading-snug transition-colors',
                          isChildActive
                            ? 'bg-muted font-medium text-foreground'
                            : 'font-normal text-foreground/50 hover:bg-accent/70 hover:text-foreground/70',
                        )}
                      >
                        {child.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/80 bg-card shadow-md transition-all duration-300',
          collapsed ? 'w-20' : 'w-[272px]',
        )}
        ref={menuRef}
      >
        {/* Logo Section */}
        <div className="min-h-[150px] flex items-center justify-center px-3">
          <Logo collapsed={collapsed} />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-2 px-3">
            {visibleMenuItems.map((item) => {
              const isRolePage = pathname === `/${MenuSection.PARTNERS}`;
              const isActive =
                isRolePage && activeRole === item.role
                  ? true
                  : `/${activeSection}` === item.href;
              const isRoleExpanded = Boolean(item.sections && openRoles[item.role]);
              const isTopLevelRole = Boolean(item.sections);
              const isPrimaryNavItem = isTopLevelRole;
              const accent = getRoleAccent(item.role);

              return (
                <li
                  key={item.href}
                  className={cn(isTopLevelRole && 'pb-2')}
                >
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (item.sections) {
                          setOpenRoles({ [item.role]: true });
                        }
                      }}
                      className={cn(
                        'flex flex-1 items-center gap-3 rounded-md px-3 transition-colors',
                        isPrimaryNavItem ? 'py-3.5' : 'py-3',
                        'hover:bg-accent hover:text-accent-foreground',
                        isActive
                          ? isPrimaryNavItem
                            ? cn(
                                'font-semibold',
                                accent.roleActiveBg,
                                accent.roleText,
                              )
                            : 'bg-accent font-medium text-accent-foreground'
                          : isPrimaryNavItem
                            ? cn('text-[15px] font-semibold', accent.roleText)
                            : 'text-sm text-muted-foreground',
                        collapsed && 'justify-center px-2',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                    {!collapsed && item.sections && (
                      <button
                        type="button"
                        onClick={() => toggleRoleSections(item.role)}
                        className="mr-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={
                          isRoleExpanded
                            ? `Collapse ${item.label} menu`
                            : `Expand ${item.label} menu`
                        }
                      >
                        <ChevronDown
                          className={cn(
                            'size-4 transition-transform duration-200',
                            isRoleExpanded && 'rotate-180',
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {renderRoleSections(item)}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <Button
          variant="link"
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute top-0 right-0 transform translate-x-1/2 translate-y-[110px] size-8 bg-card text-accent-foreground border-transparent rounded-full shadow-md"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className={sidebarIconSize} />
          ) : (
            <ChevronLeft className={sidebarIconSize} />
          )}
        </Button>
      </aside>
    </>
  );
};
