import type { Metadata } from "next";
import MMoreClient from "./MMoreClient";

export const metadata: Metadata = { title: "更多" };

export default function MobileMorePage() {
  return <MMoreClient />;
}
