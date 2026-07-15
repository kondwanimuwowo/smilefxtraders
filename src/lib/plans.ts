export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanMeta {
  id: "free" | "edge" | "pro";
  name: string;
  icon: string;
  color: string;
  tagline: string;
  popular?: boolean;
  features: PlanFeature[];
}

// Elite (K1,499 / $85) is planned but deferred — not built this pass.

export interface PlanPrices {
  planId: string;
  monthlyZmw: number;
  annualZmw: number;
  monthlyUsd: number;
  annualUsd: number;
}

export const DEFAULT_PRICES: PlanPrices[] = [
  { planId: "free", monthlyZmw: 0,   annualZmw: 0,   monthlyUsd: 0,  annualUsd: 0  },
  { planId: "edge", monthlyZmw: 249, annualZmw: 199, monthlyUsd: 15, annualUsd: 12 },
  { planId: "pro",  monthlyZmw: 549, annualZmw: 439, monthlyUsd: 35, annualUsd: 28 },
];

export const PLAN_META: PlanMeta[] = [
  {
    id: "free",
    name: "Starter",
    icon: "rocket_launch",
    color: "var(--ink-mid)",
    tagline: "Everything you need to start journaling your edge.",
    features: [
      { text: "Trade journal (up to 20 trades / month)", included: true  },
      { text: "Rules Validator",                          included: true  },
      { text: "Trend Matrix",                             included: true  },
      { text: "Economic Calendar",                        included: true  },
      { text: "Community: read-only",                    included: true  },
      { text: "Foundations course",                       included: true  },
      { text: "Unlimited journal trades",                 included: false },
      { text: "Live setup alerts from Kondwani",          included: false },
      { text: "Full Academy (all courses)",               included: false },
      { text: "Gavo AI Trade Review",                     included: false },
      { text: "COT Reports",                              included: false },
      { text: "Leaderboard",                              included: false },
      { text: "Smile as you trade",                       included: true  },
    ],
  },
  {
    id: "edge",
    name: "Edge",
    icon: "trending_up",
    color: "var(--teal)",
    tagline: "The full toolkit for serious SMC traders.",
    popular: true,
    features: [
      { text: "Unlimited trade journal",                        included: true  },
      { text: "Rules Validator",                                included: true  },
      { text: "Trend Matrix",                                   included: true  },
      { text: "Economic Calendar (live data)",                  included: true  },
      { text: "Community: post, comment, react",               included: true  },
      { text: "Full Academy (all courses + recordings)",        included: true  },
      { text: "Live setup alerts from Kondwani",                included: true  },
      { text: "Gavo AI Trade Review",                           included: true  },
      { text: "COT Reports",                                    included: true  },
      { text: "Leaderboard",                                    included: true  },
      { text: "Priority support",                               included: true  },
      { text: "1-on-1 mentorship with Kondwani",                included: false },
      { text: "Smile as you trade",                             included: true  },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: "workspace_premium",
    color: "var(--gold)",
    tagline: "Everything in Edge, plus personal mentorship toward prop funding.",
    features: [
      { text: "Everything in Edge",                             included: true  },
      { text: "1-on-1 mentorship with Kondwani",                included: true  },
      { text: "Monthly private video review session",           included: true  },
      { text: "Personalised 30-day prop firm challenge plan",   included: true  },
      { text: "Priority alert notifications",                   included: true  },
      { text: "Private Pro channel",                             included: true  },
      { text: "Smile as you trade",                             included: true  },
    ],
  },
];
