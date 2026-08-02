import { create } from 'zustand';
import { Platform } from 'react-native';

interface SettingsState {
    language: 'tr' | 'en';
    setLanguage: (lang: 'tr' | 'en') => void;
}

// Simple cross-platform storage - no persist middleware (avoids import.meta crash on web)
const STORAGE_KEY = 'runopoly-settings-language';

function readLanguage(): 'tr' | 'en' {
    try {
        if (Platform.OS === 'web') {
            const val = localStorage.getItem(STORAGE_KEY);
            if (val === 'en' || val === 'tr') return val;
        }
    } catch {}
    return 'tr';
}

function writeLanguage(lang: 'tr' | 'en') {
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(STORAGE_KEY, lang);
        }
    } catch {}
}

export const useSettingsStore = create<SettingsState>()((set) => ({
    language: readLanguage(),
    setLanguage: (lang) => {
        writeLanguage(lang);
        set({ language: lang });
    },
}));
