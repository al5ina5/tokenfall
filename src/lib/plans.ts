export const PLANS = {
  starter: { id: "starter", name: "Starter", priceSonic: "0.50", credits: 5_000_000, label: "5M credits" },
  builder: { id: "builder", name: "Builder", priceSonic: "2.00", credits: 25_000_000, label: "25M credits" },
  architect: { id: "architect", name: "Architect", priceSonic: "5.00", credits: 100_000_000, label: "100M credits" },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlan(planId: string) {
  return PLANS[planId as PlanId];
}
