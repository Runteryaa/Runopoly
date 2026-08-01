import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';

interface InventoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function InventoryModal({ visible, onClose }: InventoryModalProps) {
    const { gamePlayers, playerName, properties, removeCardFromInventory, executeCard, lobbyCode } = useGameStore();
    const myPlayer = gamePlayers.find(p => p.name === playerName);
    
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

    useEffect(() => {
        if (visible && myPlayer) {
            setSelectedPlayerId(myPlayer.id);
        }
    }, [visible]);

    if (!myPlayer) return null;

    const viewedPlayer = gamePlayers.find(p => p.id === selectedPlayerId) || myPlayer;
    const viewedProperties = properties.filter(p => p.ownerId === viewedPlayer.id);
    const viewedCards = viewedPlayer.inventoryCards || [];

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 max-h-[80%] w-full flex-shrink">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-2xl font-black">Inventories</Text>
                        <TouchableOpacity onPress={onClose} className="bg-zinc-700 w-8 h-8 rounded-full items-center justify-center">
                            <Text className="text-white font-bold">X</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-[45px] min-h-[45px]">
                        {gamePlayers.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                onPress={() => setSelectedPlayerId(p.id)}
                                className={`mr-2 px-4 h-[40px] justify-center rounded-xl border ${selectedPlayerId === p.id ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-700 border-zinc-600'}`}
                            >
                                <Text className="text-white font-bold">{p.id === myPlayer.id ? 'Me' : p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View className="bg-zinc-900 p-4 rounded-xl mb-4 border border-zinc-700 flex-row justify-between items-center">
                        <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Total Balance</Text>
                        <Text className="text-emerald-400 text-2xl font-black">${viewedPlayer.money}</Text>
                    </View>

                    <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-3">{viewedPlayer.name}'s Properties ({viewedProperties.length})</Text>
                    <ScrollView className="w-full mt-2">
                        {viewedProperties.length === 0 ? (
                            <Text className="text-zinc-500 italic text-center py-4">No properties owned yet.</Text>
                        ) : (
                            viewedProperties.map(prop => (
                                <View key={prop.id} className="bg-zinc-900 p-4 rounded-xl mb-3 border border-zinc-700 flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-3">
                                        <View style={{ backgroundColor: prop.color }} className="w-4 h-4 rounded-full border border-zinc-600" />
                                        <View>
                                            <Text className="text-white font-bold text-lg">{prop.name}</Text>
                                            <Text className="text-zinc-500 text-[10px] font-bold">
                                                Houses: {prop.houses || 0} • Hotels: {prop.hotels || 0}
                                            </Text>
                                        </View>
                                        {viewedPlayer.id === myPlayer.id && !prop.isMortgaged && (
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    const cost = prop.housePrice || 50;
                                                    const currentHouses = prop.houses || 0;
                                                    const currentHotels = prop.hotels || 0;
                                                    
                                                    if (myPlayer.money < cost) {
                                                        alert(`You need $${cost} to build a house!`);
                                                        return;
                                                    }
                                                    if (currentHotels >= 1) {
                                                        alert('This property is fully upgraded.');
                                                        return;
                                                    }

                                                    // Monopoly Rule 1: Own all properties of the same color
                                                    const allProps = useGameStore.getState().properties;
                                                    const sameColorProps = allProps.filter(p => p.color === prop.color && p.price > 0);
                                                    const ownsAll = sameColorProps.every(p => p.ownerId === myPlayer.id);
                                                    
                                                    if (!ownsAll) {
                                                        alert('You must own all properties of this color group to build!');
                                                        return;
                                                    }

                                                    // Monopoly Rule 2: Build Evenly
                                                    const getUpgradeLevel = (p: any) => (p.hotels || 0) * 5 + (p.houses || 0);
                                                    const currentLevel = getUpgradeLevel(prop);
                                                    const minLevelInGroup = Math.min(...sameColorProps.map(getUpgradeLevel));

                                                    if (currentLevel > minLevelInGroup) {
                                                        alert('You must build evenly! Upgrade other properties in this color group first.');
                                                        return;
                                                    }
                                                    
                                                    let h = currentHouses, ht = currentHotels;
                                                    if (h === 4) { h = 0; ht = 1; } else { h++; }
                                                    
                                                    import('../utils/socket').then(m => {
                                                        m.socket.emit('upgrade_property', { 
                                                            lobbyCode: useGameStore.getState().lobbyCode, 
                                                            propertyId: prop.id, 
                                                            houses: h, 
                                                            hotels: ht, 
                                                            cost 
                                                        });
                                                    });
                                                }}
                                                className="bg-emerald-500/20 px-3 py-1 rounded-full ml-2 border border-emerald-500/50"
                                            >
                                                <Text className="text-emerald-400 font-bold text-xs uppercase">Build (${prop.housePrice})</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View className="items-end gap-2">
                                        <View className="items-end">
                                            <Text className="text-zinc-500 font-bold text-[10px] uppercase">Rent Yield</Text>
                                            <Text className={`font-black ${prop.isMortgaged ? 'text-red-500 line-through' : 'text-emerald-400'}`}>${prop.rent}</Text>
                                        </View>
                                        
                                        {viewedPlayer.id === myPlayer.id && (
                                            prop.isMortgaged ? (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        const unmortgageCost = Math.ceil((prop.price / 2) * 1.1);
                                                        if (myPlayer.money < unmortgageCost) {
                                                            alert(`You need $${unmortgageCost} to unmortgage this property.`);
                                                            return;
                                                        }
                                                        import('../utils/socket').then(m => {
                                                            m.socket.emit('toggle_mortgage', {
                                                                lobbyCode: useGameStore.getState().lobbyCode,
                                                                propertyId: prop.id,
                                                                isMortgaged: false,
                                                                cost: -unmortgageCost
                                                            });
                                                        });
                                                    }}
                                                    className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/50"
                                                >
                                                    <Text className="text-emerald-400 font-bold text-[10px] uppercase">Unmortgage (-${Math.ceil((prop.price / 2) * 1.1)})</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        const allProps = useGameStore.getState().properties;
                                                        const sameColorProps = allProps.filter(p => p.color === prop.color);
                                                        const hasHouses = sameColorProps.some(p => (p.houses || 0) > 0 || (p.hotels || 0) > 0);
                                                        
                                                        if (hasHouses) {
                                                            alert('You must sell all houses in this color group before mortgaging!');
                                                            return;
                                                        }
                                                        
                                                        import('../utils/socket').then(m => {
                                                            m.socket.emit('toggle_mortgage', {
                                                                lobbyCode: useGameStore.getState().lobbyCode,
                                                                propertyId: prop.id,
                                                                isMortgaged: true,
                                                                cost: Math.floor(prop.price / 2)
                                                            });
                                                        });
                                                    }}
                                                    className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50"
                                                >
                                                    <Text className="text-red-400 font-bold text-[10px] uppercase">Mortgage (+${Math.floor(prop.price / 2)})</Text>
                                                </TouchableOpacity>
                                            )
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-3 mt-4">{viewedPlayer.name}'s Cards ({viewedCards.length})</Text>
                    <ScrollView className="w-full max-h-[150px]">
                        {viewedCards.length === 0 ? (
                            <Text className="text-zinc-500 italic text-center py-4">No cards in inventory.</Text>
                        ) : (
                            viewedCards.map((card: any) => (
                                <View key={card.id} className={`p-4 rounded-xl mb-3 border flex-row justify-between items-center ${viewedPlayer.id === myPlayer.id ? (card.type === 'chance' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/30') : 'bg-zinc-900 border-zinc-700'}`}>
                                    {viewedPlayer.id === myPlayer.id ? (
                                        <>
                                            <View className="flex-1 pr-4">
                                                <View className="flex-row items-center gap-2 mb-1">
                                                    <Text className={`font-black text-xs uppercase tracking-widest ${card.type === 'chance' ? 'text-orange-500' : 'text-blue-500'}`}>{card.type}</Text>
                                                    <View className="bg-white/10 px-2 py-0.5 rounded text-[10px]">
                                                        <Text className="text-white/50 font-bold text-[10px] uppercase">{card.behavior || 'instant'}</Text>
                                                    </View>
                                                </View>
                                                <Text className="text-white font-bold text-sm leading-tight">{card.text}</Text>
                                            </View>
                                            <View className="flex-col gap-2">
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        import('../utils/socket').then(m => {
                                                            m.socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card: { ...card, action: 'show' } });
                                                        });
                                                    }}
                                                    className="bg-zinc-700/50 px-3 py-1.5 rounded-lg border border-zinc-600/50 items-center"
                                                >
                                                    <Text className="text-white font-bold text-xs">Show</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        import('../utils/socket').then(m => {
                                                            // Execute the actual card action
                                                            m.socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card });
                                                            // Remove from inventory
                                                            m.socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { inventoryCards: viewedCards.filter((c: any) => c.id !== card.id) } });
                                                        });
                                                    }}
                                                    className="bg-emerald-500 px-3 py-1.5 rounded-lg items-center"
                                                >
                                                    <Text className="text-white font-bold text-xs shadow-sm shadow-emerald-500/20">Use</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <View className="flex-1 flex-row items-center gap-3">
                                            <View className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 items-center justify-center">
                                                <Text className="text-zinc-500 font-bold">?</Text>
                                            </View>
                                            <Text className="text-zinc-400 font-bold italic">Secret Card</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
