import React, { useState, useEffect } from 'react';
import { View, Text, Modal,StyleSheet } from 'react-native';
import { useTranslation } from '../utils/i18n';
import DiceFace from './DiceFace';

export default function DiceRollerModal({ visible, dice1, dice2, onComplete }: { visible: boolean, dice1: number, dice2: number, onComplete: () => void }) {
    const [currentD1, setCurrentD1] = useState(1);
    const [currentD2, setCurrentD2] = useState(1);
    const { t } = useTranslation();

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
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t('rolling')}</Text>
                    <View style={styles.row}>
                        <View style={styles.diceBox}>
                            <DiceFace value={currentD1} size={80} color="#ffffff" dotColor="#111111" />
                        </View>
                        <View style={styles.diceBox}>
                            <DiceFace value={currentD2} size={80} color="#ffffff" dotColor="#111111" />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#3f3f46', padding: 32, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    title: { color: '#d4d4d8', fontSize: 20, fontWeight: '900', letterSpacing: 4, marginBottom: 24 },
    row: { flexDirection: 'row', gap: 24 },
    diceBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});
