"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Home, Waypoints, Archive, BarChart3, BrainCircuit, BookOpen } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/documentation', label: 'Documentation', icon: BookOpen },
  { href: '/tsp-solver', label: 'TSP Solver', icon: Waypoints },
  { href: '/knapsack-solver', label: 'Knapsack Solver', icon: Archive },
  { href: '/benchmark-analysis', label: 'Benchmark Analysis', icon: BarChart3 },
  { href: '/ai-estimation', label: 'AI Estimation', icon: BrainCircuit },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  'justify-start',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
                tooltip={{children: item.label}}
              >
                <a>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
