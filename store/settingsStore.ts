import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface SettingsState {
    language: 'tr' | 'en';
    setLanguage: (lang: 'tr' | 'en') => void;
}

const storage = Platform.OS === 'web'
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => AsyncStorage);

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'tr',
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'runopoly-settings',
            storage,
        }
    )
);
