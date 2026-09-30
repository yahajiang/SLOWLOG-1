import type { Metadata } from "next";
import NotesClient from "./NotesClient";

export const metadata: Metadata = { title: "随想" };

export default function NotesPage() {
  return <NotesClient />;
}
