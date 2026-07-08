
'use client';

import { useSidebar, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { SheetClose } from '@/components/ui/sheet';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

type NavMenuItemProps = {
  href: string;
  tooltip: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

export function NavMenuItem({ href, tooltip, icon: Icon, children }: NavMenuItemProps) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const isActive = href === '/admin' || href === '/dashboard'
    ? pathname === href 
    : pathname === href || pathname.startsWith(href + '/');

  const button = (
    <SidebarMenuButton 
      asChild 
      tooltip={tooltip}
      isActive={isActive}
      className={`
        rounded-lg px-3 py-2 transition-all duration-200 gap-3 text-sm font-medium h-9 border
        ${isActive 
          ? '!bg-primary !text-primary-foreground hover:!bg-primary/95 hover:!text-primary-foreground border-primary/20 shadow-md font-semibold' 
          : 'bg-background hover:bg-muted/50 border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-muted-foreground hover:text-foreground'
        }
      `}
    >
      <Link href={href}>
        <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
        <span>{children}</span>
      </Link>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem className="my-1.5 px-2">
      {isMobile ? <SheetClose asChild>{button}</SheetClose> : button}
    </SidebarMenuItem>
  );
}