import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiProvider, Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface PersistedSettings { settings?: Partial<Settings> & { apiKeys?: unknown; [key: string]: unknown }; }
interface SettingsState { settings: Settings; updateAiProvider: (provider: AiProvider) => void; updateNotification: (key: keyof Settings['notifications'], value: boolean) => void; updateSecurity: (key: keyof Settings['security'], value: boolean | string[]) => void; resetSettings: () => void; }

function sanitizeSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
  const candidate = value as PersistedSettings['settings'];
  const source = candidate ?? {};
  return {
    aiProvider: source.aiProvider === 'gemini' ? 'gemini' : DEFAULT_SETTINGS.aiProvider,
    theme: 'dark',
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(source.notifications ?? {}) },
    security: { ...DEFAULT_SETTINGS.security, ...(source.security ?? {}) },
  };
}

export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  settings: DEFAULT_SETTINGS,
  updateAiProvider: (provider) => set((state) => ({ settings: { ...state.settings, aiProvider: provider } })),
  updateNotification: (key, value) => set((state) => ({ settings: { ...state.settings, notifications: { ...state.settings.notifications, [key]: value } } })),
  updateSecurity: (key, value) => set((state) => ({ settings: { ...state.settings, security: { ...state.settings.security, [key]: value } } })),
  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
}), {
  name: 'uliong-settings',
  version: 1,
  migrate: (persistedState) => ({ settings: sanitizeSettings((persistedState as PersistedSettings | undefined)?.settings) }),
}));
