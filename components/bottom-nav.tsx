"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CirclePlus, Home, User } from "lucide-react";

import { cn } from "@/lib/utils";

// 각 탭은 배열 순서에 의존하지 않고 자기 자신의 조건식으로 활성 여부를 독립 판정한다.
// 특히 "이벤트" 탭은 "/protected/events/new"를 명시적으로 제외해 "새 이벤트" 탭과 겹치지 않도록 한다.
const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: Home,
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/protected/events",
    label: "이벤트",
    icon: CalendarDays,
    isActive: (pathname: string) =>
      pathname.startsWith("/protected/events") &&
      pathname !== "/protected/events/new",
  },
  {
    href: "/protected/events/new",
    label: "새 이벤트",
    icon: CirclePlus,
    isActive: (pathname: string) => pathname === "/protected/events/new",
  },
  {
    href: "/protected/profile",
    label: "프로필",
    icon: User,
    isActive: (pathname: string) => pathname === "/protected/profile",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-50 border-t">
      <div className="mx-auto flex w-full max-w-md items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
