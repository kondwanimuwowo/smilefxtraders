import { CheckoutPage } from "./CheckoutPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Upgrade — Smile FX Traders" };

export default function Page({ params }: { params: Promise<{ plan: string }> }) {
  return <CheckoutPage paramsPromise={params} />;
}
