import type { Metadata } from "next";
import MTokensClient from "./MTokensClient";

export const metadata: Metadata = { title: "App 令牌" };

export default function MobileTokensPage() {
  return <MTokensClient />;
}
