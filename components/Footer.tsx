import { memo } from "react";
import { FooterContent } from "./FooterContent";

export const Footer = memo(function Footer() {
  return (
    <footer className="mt-16 bg-gradient-to-b from-transparent to-[var(--yh-bg)]">
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--yh-border)] to-transparent mb-8" />
        <div className="flex flex-col items-center gap-3 text-center">
          <FooterContent />
        </div>
      </div>
    </footer>
  );
});
