"use client";

import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type SignOutButtonProps = {
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
};

export function SignOutButton({
  className,
  variant = "outline",
}: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      className={cn(className)}
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  );
}
