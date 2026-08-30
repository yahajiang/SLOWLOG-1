import { memo } from "react";
import { FooterContent } from "./FooterContent";

export const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-[var(--yh-border)] py-12 mt-12 bg-white/50">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <FooterContent />
        </div>
      </div>
    </footer>
  );
});
