import { memo } from "react";
import { AUTHOR_BG } from "@/lib/categories";

export const AuthorAvatar = memo(function AuthorAvatar({
  initial,
  size = "sm",
}: {
  initial: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-semibold shrink-0 ${AUTHOR_BG[initial] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {initial}
    </div>
  );
});
