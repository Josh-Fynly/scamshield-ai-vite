import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiProvider, Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  settings: Settings;
  updateAiProvider: (provider: AiProvider) => void;
  updateNotification: (
    key: keyof Settings['notifications'],
    value: boolean
  ) => void;
  updateSecurity: (
    key: keyof Settings['security'],
    value: boolean | string[]
  ) => void;
  resetSettings: () => void;
}

interface PersistedSettingsState {
  settings?: Partial<Settings> & {
    apiKeys?: unknown;
  };
}

const sanitizePersistedSettings = (
  persisted: PersistedSettingsState | undefined
): Settings => {
  const stored = persisted?.settings;

  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  return {
    aiProvider:
      stored.aiProvider === 'gemini' || stored.aiProvider === 'openai'
        ? stored.aiProvider
        : DEFAULT_SETTINGS.aiProvider,

    theme: 'dark',

    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(stored.notifications ?? {}),
    },

    security: {
      ...DEFAULT_SETTINGS.security,
      ...(stored.security ?? {}),
      ipWhitelist: Array.isArray(stored.security?.ipWhitelist)
        ? stored.security.ipWhitelist.filter(
            (value): value is string => typeof value === 'string'
          )
        : DEFAULT_SETTINGS.security.ipWhitelist,
    },
  };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateAiProvider: (provider) =>
        set((state) => ({
          settings: {
            ...state.settings,
            aiProvider: provider,
          },
        })),

      updateNotification: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              [key]: value,
            },
          },
        })),

      updateSecurity: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            security: {
              ...state.settings.security,
              [key]: value,
            },
          },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'uliong-settings',
      version: 2,

      migrate: (persistedState) =>
        sanitizePersistedSettings(
          persistedState as PersistedSettingsState | undefined
        ),

      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
