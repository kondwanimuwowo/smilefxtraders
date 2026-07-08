"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface FAQAccordionItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  items: FAQAccordionItem[];
  title?: string;
  titleClassName?: string;
  className?: string;
}

export function FAQAccordion({ items, title, titleClassName, className }: FAQAccordionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className={className}>
      {title && <h2 className={titleClassName}>{title}</h2>}
      <div className="mt-8">
        {items.map(({ q, a }, i) => (
          <div key={q} className="border-b border-line">
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left bg-transparent border-none py-5 flex items-center justify-between gap-4 cursor-pointer font-display text-[17px] font-semibold text-ink"
            >
              {q}
              <Icon
                name="add"
                className={cn(
                  "text-teal shrink-0 transition-transform duration-[250ms]",
                  openFaq === i ? "rotate-45" : "rotate-0"
                )}
              />
            </button>
            <div
              className="overflow-hidden transition-[max-height] duration-300 ease-app"
              style={{ maxHeight: openFaq === i ? 500 : 0 }}
            >
              <p className="pb-5 text-[14.5px] text-ink-mid leading-[1.65]">{a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
