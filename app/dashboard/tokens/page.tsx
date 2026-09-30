import type { Metadata } from "next";
import TokensClient from "./TokensClient";

export const metadata: Metadata = { title: "App 令牌" };

export default function TokensPage() {
  return <TokensClient />;
}
