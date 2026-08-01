import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Animated, Easing, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from '../utils/i18n';

export default function DiceRollerModal({ visible, dice1, dice2, onComplete }: { visible: boolean, dice1: number, dice2: number, onComplete: () => void }) {
    const [currentD1, setCurrentD1] = useState(1);
    const [currentD2, setCurrentD2] = useState(1);
    const { t } = useTranslation();
    
    // Fallback if vector icons fail to load or something, but we'll use MaterialCommunityIcons (dice-1, dice-2, etc.)
    const getDiceIcon = (num: number) => {
        switch(num) {
            case 1: return 'dice-1';
            case 2: return 'dice-2';
            case 3: return 'dice-3';
            case 4: return 'dice-4';
            case 5: return 'dice-5';
            case 6: return 'dice-6';
            default: return 'dice-1';
        }
    };

    useEffect(() => {
        if (visible) {
            let rollInterval = setInterval(() => {
                setCurrentD1(Math.floor(Math.random() * 6) + 1);
                setCurrentD2(Math.floor(Math.random() * 6) + 1);
            }, 100); // spin very fast

            setTimeout(() => {
                clearInterval(rollInterval);
                setCurrentD1(dice1);
                setCurrentD2(dice2);
                
                // wait half a second showing the final result before closing
                setTimeout(() => {
                    onComplete();
                }, 1000);
                
            }, 1000); // 1 second of spinning
            
            return () => clearInterval(rollInterval);
        }
    }, [visible, dice1, dice2]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View className="flex-1 bg-black/60 justify-center items-center">
                <View className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl items-center">
                    <Text className="text-white text-2xl font-black mb-6 tracking-widest text-zinc-300">{t('rolling')}</Text>
                    
                    <View className="flex-row gap-6">
                        <View className="bg-white rounded-2xl w-24 h-24 justify-center items-center shadow-lg">
                            <MaterialCommunityIcons name={getDiceIcon(currentD1) as any} size={80} color="black" />
                        </View>
                        <View className="bg-white rounded-2xl w-24 h-24 justify-center items-center shadow-lg">
                            <MaterialCommunityIcons name={getDiceIcon(currentD2) as any} size={80} color="black" />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
