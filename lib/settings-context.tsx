"use client";

import { createContext, useContext } from "react";
import { SETTINGS_DEFAULTS, type SiteSettings } from "@/lib/settings-shared";

/**
 * 站点设置的客户端分发：根 layout（RSC）读取 Setting 后经 Provider 下发，
 * Header / Footer / manifest 等按需 useSiteSettings() 消费——
 * 各页面无需自行查库或逐层透传 props。
 * Provider 之外使用（如测试）回退默认值，不抛错。
 */
const SettingsContext = createContext<SiteSettings>(SETTINGS_DEFAULTS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SettingsContext);
}
