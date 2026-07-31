import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (amount: number) => void;
}

export default function LoanRequestModal({ visible, onClose, onSubmit }: Props) {
    const [amount, setAmount] = useState('');

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View className="flex-1 bg-black/80 justify-center items-center p-6">
                <View className="bg-zinc-800 rounded-3xl p-6 w-full max-w-sm border border-zinc-700">
                    <Text className="text-white font-black text-2xl mb-4 text-center">Request Loan</Text>
                    <Text className="text-zinc-400 text-center mb-6 font-bold">Enter the amount of money you want to borrow from other players.</Text>
                    
                    <View className="bg-zinc-900 border border-zinc-700 rounded-2xl mb-6 p-4">
                        <TextInput
                            className="text-white font-black text-3xl text-center"
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#52525b"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <TouchableOpacity 
                            onPress={onClose}
                            className="flex-1 py-4 items-center bg-zinc-700 rounded-2xl"
                        >
                            <Text className="text-white font-bold text-lg">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                const parsed = parseInt(amount);
                                if (parsed > 0) {
                                    onSubmit(parsed);
                                    setAmount('');
                                    onClose();
                                }
                            }}
                            className="flex-1 py-4 items-center bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/30"
                        >
                            <Text className="text-white font-black text-lg">Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
