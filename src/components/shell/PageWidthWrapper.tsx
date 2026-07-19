"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

// Most pages read best centered at a comfortable line-length; a dense data
// table (Journal) benefits from the full main-content width instead.
const FULL_WIDTH_ROUTES = ["/journal"];

export function PageWidthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(pathname);

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 pt-5 pb-24 md:pb-12",
        isFullWidth ? "max-w-none" : "max-w-[1320px]"
      )}
    >
      {children}
    </div>
  );
}
