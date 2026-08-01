import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '../utils/i18n';

export default function SettingsModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const { language, setLanguage } = useSettingsStore();
    const { t } = useTranslation();

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/80 justify-center items-center p-6">
                <View className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-sm">
                    <Text className="text-white text-2xl font-black mb-6 text-center">{t('settings')}</Text>

                    <Text className="text-zinc-400 font-bold mb-2 uppercase text-xs">{t('language')}</Text>
                    <View className="flex-row gap-2 mb-8">
                        <TouchableOpacity 
                            className={`flex-1 py-3 rounded-xl items-center border ${language === 'tr' ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-800 border-zinc-700'}`}
                            onPress={() => setLanguage('tr')}
                        >
                            <Text className={`font-bold ${language === 'tr' ? 'text-white' : 'text-zinc-400'}`}>Türkçe</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            className={`flex-1 py-3 rounded-xl items-center border ${language === 'en' ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-800 border-zinc-700'}`}
                            onPress={() => setLanguage('en')}
                        >
                            <Text className={`font-bold ${language === 'en' ? 'text-white' : 'text-zinc-400'}`}>English</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        className="bg-zinc-800 py-4 rounded-xl items-center border border-zinc-700"
                        onPress={onClose}
                    >
                        <Text className="text-white font-bold">{t('close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
