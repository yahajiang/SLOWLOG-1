import type { Metadata } from "next";
import MediaClient from "./MediaClient";

export const metadata: Metadata = { title: "媒体库" };

export default function MediaPage() {
  return <MediaClient />;
}
