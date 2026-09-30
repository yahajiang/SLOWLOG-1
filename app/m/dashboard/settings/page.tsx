import type { Metadata } from "next";
import MSettingsClient from "./MSettingsClient";

export const metadata: Metadata = { title: "设置" };

export default function MobileSettingsPage() {
  return <MSettingsClient />;
}
