import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiProvider, Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  settings: Settings;
  updateAiProvider: (provider: AiProvider) => void;
  updateNotification: (key: keyof Settings['notifications'], value: boolean) => void;
  updateSecurity: (key: keyof Settings['security'], value: boolean | string[]) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateAiProvider: (provider) => set((state) => ({ settings: { ...state.settings, aiProvider: provider } })),
      updateNotification: (key, value) => set((state) => ({ settings: { ...state.settings, notifications: { ...state.settings.notifications, [key]: value } } })),
      updateSecurity: (key, value) => set((state) => ({ settings: { ...state.settings, security: { ...state.settings.security, [key]: value } } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'uliong-settings' },
  ),
);
