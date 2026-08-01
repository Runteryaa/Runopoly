import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    language: 'tr' | 'en';
    setLanguage: (lang: 'tr' | 'en') => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'tr', // Default to Turkish as requested by the user often speaking TR
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'runopoly-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
