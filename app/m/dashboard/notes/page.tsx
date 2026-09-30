import type { Metadata } from "next";
import MNotesClient from "./MNotesClient";

export const metadata: Metadata = { title: "随想" };

export default function MobileNotesPage() {
  return <MNotesClient />;
}
