"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Profile } from "@/lib/server/profile";

import { Sidebar } from "./sidebar";

type TopNavProps = {
  profile: Pick<Profile, "full_name" | "id">;
  email?: string | null;
};

function getInitials(name: string | null): string {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TopNav({ profile, email }: TopNavProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const displayName = profile.full_name ?? "User";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <h1 className="text-sm font-medium text-foreground md:text-base">
          Dashboard
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-auto gap-2 px-2 py-1.5"
              aria-label="Open user menu"
            />
          }
        >
          <Avatar size="sm">
            <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {displayName}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{displayName}</p>
              {email && (
                <p className="text-xs text-muted-foreground">{email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-1">
            <SignOutButton variant="ghost" className="w-full justify-start" />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
