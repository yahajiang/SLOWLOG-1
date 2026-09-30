import type { Metadata } from "next";
import ChangePasswordClient from "./ChangePasswordClient";

export const metadata: Metadata = { title: "修改密码" };

export default function ChangePasswordPage() {
  return <ChangePasswordClient />;
}
