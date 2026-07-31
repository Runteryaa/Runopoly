import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useGameStore, Property } from '../store/gameStore';

import { socket } from '../utils/socket';

interface PropertyInfoModalProps {
    propertyId: string | null;
    onClose: () => void;
    onTradePress?: (ownerId: string, propertyId: string) => void;
    myPlayerId?: string;
    lobbyCode?: string;
}

export default function PropertyInfoModal({ propertyId, onClose, onTradePress, myPlayerId, lobbyCode }: PropertyInfoModalProps) {
    const { properties, gamePlayers } = useGameStore();
    if (!propertyId) return null;

    const property = properties.find(p => p.id === propertyId);
    if (!property) return null;

    const owner = property.ownerId ? gamePlayers.find(p => p.id === property.ownerId) : null;
    const isSpecial = property.price === 0;

    const sameColorProps = properties.filter(p => p.color === property.color && !isSpecial);
    const hasFullSet = sameColorProps.length > 0 && sameColorProps.every(p => p.ownerId === property.ownerId && p.ownerId != null);
    
    const getBldgs = (p: Property) => Math.max(0, (p.houses || 0)) + (p.hotels || 0) * 5;
    const currentBldgs = getBldgs(property);
    const minBldgsInSet = Math.min(...sameColorProps.map(getBldgs));
    const maxBldgsInSet = Math.max(...sameColorProps.map(getBldgs));
    
    const isMortgaged = (property.houses || 0) === -1;
    const anyMortgaged = sameColorProps.some(p => (p.houses || 0) === -1);
    
    const canBuildHouse = currentBldgs < 4;
    const canBuildHotel = currentBldgs === 4 && minBldgsInSet >= 4;
    const canBuild = hasFullSet && !anyMortgaged && (canBuildHouse || canBuildHotel);
    
    const isUnimproved = (property.houses || 0) === 0 && (property.hotels || 0) === 0;
    const currentRent = isUnimproved && hasFullSet && !anyMortgaged ? property.rent * 2 : property.rent;
    const houseCost = Math.max(50, Math.floor(property.price / 100) * 50);

    const isStation = property.name === 'STATION';
    const isUtility = property.name === 'UTILITY';
    const isBuildable = !isStation && !isUtility;

    const handleBuild = () => {
        if (!lobbyCode || !myPlayerId) return;
        const isHotel = currentBldgs === 4;
        
        socket.emit('upgrade_property', {
            lobbyCode,
            propertyId: property.id,
            houses: isHotel ? 0 : (property.houses || 0) + 1,
            hotels: isHotel ? 1 : 0,
            cost: houseCost
        });
    };

    const handleSell = () => {
        if (!lobbyCode || !myPlayerId || currentBldgs === 0) return;
        
        socket.emit('upgrade_property', {
            lobbyCode,
            propertyId: property.id,
            houses: currentBldgs === 5 ? 4 : (property.houses || 0) - 1,
            hotels: 0,
            cost: -(houseCost / 2) // Sell for half price
        });
    };

    const handleMortgage = () => {
        if (!lobbyCode || !myPlayerId || maxBldgsInSet > 0) return;
        socket.emit('upgrade_property', {
            lobbyCode,
            propertyId: property.id,
            houses: -1,
            hotels: 0,
            cost: -(property.price / 2)
        });
    };

    const handleUnmortgage = () => {
        if (!lobbyCode || !myPlayerId) return;
        const mortgageTurns = Math.abs(property.houses || 0);
        const baseUnmortgageCost = property.price / 2;
        const interestRate = 0.10 + Math.max(0, mortgageTurns - 1) * 0.01;
        const cost = Math.floor(baseUnmortgageCost * (1 + interestRate));

        socket.emit('upgrade_property', {
            lobbyCode,
            propertyId: property.id,
            houses: 0,
            hotels: 0,
            cost: cost
        });
    };

    return (
        <Modal visible={!!propertyId} animationType="fade" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-6">
                <View className="bg-zinc-800 rounded-3xl border border-zinc-700 w-full overflow-hidden shadow-2xl">
                    {!isSpecial && (
                        <View style={{ backgroundColor: property.color }} className="w-full py-4 items-center border-b border-black/20">
                            <Text className="text-black/50 font-black text-[10px] uppercase tracking-widest mb-1">Title Deed</Text>
                            <Text className="text-white font-black text-2xl text-center px-4" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }}>
                                {property.name}
                            </Text>
                        </View>
                    )}

                    {isSpecial && (
                        <View className="w-full py-6 items-center bg-zinc-700 border-b border-black/20">
                            <Text className="text-white font-black text-2xl text-center px-4">{property.name}</Text>
                        </View>
                    )}

                    <View className="p-6">
                        {!isSpecial ? (
                            <>
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Owner</Text>
                                    {owner ? (
                                        <View className="flex-row items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700">
                                            <View style={{ backgroundColor: owner.color }} className="w-3 h-3 rounded-full" />
                                            <Text className="text-white font-bold">{owner.name}</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-zinc-500 font-bold italic">Unowned</Text>
                                    )}
                                </View>

                                <View className="bg-zinc-900 rounded-xl p-4 border border-zinc-700 mb-6">
                                    {isMortgaged ? (
                                        <View className="py-4 items-center">
                                            <Text className="text-red-500 font-black text-xl uppercase tracking-widest">Mortgaged</Text>
                                            <Text className="text-zinc-500 font-bold text-xs mt-1">This property collects no rent.</Text>
                                        </View>
                                    ) : isStation ? (
                                        <>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">Rent (1 Station)</Text>
                                                <Text className="text-emerald-400 font-black">$25</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">Rent (2 Stations)</Text>
                                                <Text className="text-emerald-400 font-bold">$50</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">Rent (3 Stations)</Text>
                                                <Text className="text-emerald-400 font-bold">$100</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-orange-400 font-black">Rent (4 Stations)</Text>
                                                <Text className="text-emerald-400 font-black">$200</Text>
                                            </View>
                                        </>
                                    ) : isUtility ? (
                                        <>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">Rent (1 Utility)</Text>
                                                <Text className="text-emerald-400 font-bold">4x Dice Roll</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-orange-400 font-black">Rent (2 Utilities)</Text>
                                                <Text className="text-emerald-400 font-black">10x Dice Roll</Text>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <View className="flex-row items-center gap-1">
                                                    <Text className="text-zinc-400 font-bold">Rent</Text>
                                                    {isUnimproved && hasFullSet && (
                                                        <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/50">
                                                            <Text className="text-emerald-400 text-[8px] font-black uppercase">Color Set 2x</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text className="text-emerald-400 font-black">${currentRent}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">With 1 House</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 2}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">With 2 Houses</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 3}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">With 3 Houses</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 4}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">With 4 Houses</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 5}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-zinc-800">
                                                <Text className="text-orange-400 font-black">With Hotel</Text>
                                                <Text className="text-emerald-400 font-black">${property.rent * 6}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>

                                {isBuildable && (
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-zinc-500 font-bold text-xs uppercase">House Cost</Text>
                                        <Text className="text-zinc-300 font-bold">${houseCost} each</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between items-center mt-1">
                                    <Text className="text-zinc-500 font-bold text-xs uppercase">Property Price</Text>
                                    <Text className="text-white font-black">${property.price}</Text>
                                </View>

                                {owner && myPlayerId && owner.id !== myPlayerId && onTradePress && (
                                    <TouchableOpacity 
                                        onPress={() => onTradePress(owner.id, property.id)} 
                                        className="bg-emerald-500/20 border border-emerald-500 py-3 rounded-xl items-center mt-6"
                                    >
                                        <Text className="text-emerald-500 font-black text-sm uppercase tracking-widest">Trade with {owner.name}</Text>
                                    </TouchableOpacity>
                                )}

                                {owner && myPlayerId && owner.id === myPlayerId && (
                                    <View className="mt-6 gap-2">
                                        {isMortgaged ? (
                                            <TouchableOpacity 
                                                onPress={handleUnmortgage}
                                                className="bg-emerald-500 py-3 rounded-xl items-center border-b-4 border-emerald-700"
                                            >
                                                <Text className="text-white font-black text-sm uppercase tracking-widest">
                                                    Unmortgage (${Math.floor((property.price / 2) * (1 + 0.10 + Math.max(0, Math.abs(property.houses || 0) - 1) * 0.01))})
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <>
                                                {isBuildable && (
                                                    <>
                                                        {!hasFullSet ? (
                                                            <Text className="text-zinc-500 text-xs text-center font-bold">You need the full color set to build.</Text>
                                                        ) : anyMortgaged ? (
                                                            <Text className="text-zinc-500 text-xs text-center font-bold">Cannot build while a property in this set is mortgaged.</Text>
                                                        ) : canBuild ? (
                                                            <TouchableOpacity 
                                                                onPress={handleBuild}
                                                                className="bg-blue-500 py-3 rounded-xl items-center border-b-4 border-blue-700"
                                                            >
                                                                <Text className="text-white font-black text-sm uppercase tracking-widest">
                                                                    Build {currentBldgs === 4 ? 'Hotel' : 'House'} (${houseCost})
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ) : currentBldgs === 5 ? (
                                                            <Text className="text-emerald-500 text-xs text-center font-bold">Fully upgraded!</Text>
                                                        ) : (
                                                            <Text className="text-zinc-500 text-xs text-center font-bold">To build a hotel, all properties of this color must have 4 houses.</Text>
                                                        )}
                                                        
                                                        {currentBldgs > 0 && (
                                                            <TouchableOpacity 
                                                                onPress={handleSell}
                                                                className="bg-red-500/20 border border-red-500 py-3 rounded-xl items-center"
                                                            >
                                                                <Text className="text-red-500 font-black text-sm uppercase tracking-widest">
                                                                    Sell {currentBldgs === 5 ? 'Hotel' : 'House'} (+${houseCost / 2})
                                                                </Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {maxBldgsInSet === 0 && (
                                                    <TouchableOpacity 
                                                        onPress={handleMortgage}
                                                        className="bg-orange-500/20 border border-orange-500 py-3 rounded-xl items-center mt-2"
                                                    >
                                                        <Text className="text-orange-500 font-black text-sm uppercase tracking-widest">
                                                            Mortgage (+${property.price / 2})
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                                {maxBldgsInSet > 0 && isBuildable && (
                                                    <Text className="text-zinc-500 text-xs text-center font-bold mt-2">Sell all buildings on this color set to mortgage.</Text>
                                                )}
                                            </>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View className="py-4 items-center">
                                <Text className="text-zinc-400 text-center leading-relaxed">
                                    {property.name === 'GO' && "Collect salary when you pass this space."}
                                    {property.name === 'JAIL' && "Just visiting, or stuck behind bars!"}
                                    {property.name === 'PARKING' && "A safe place to rest. Nothing happens here."}
                                    {property.name === 'GO TO JAIL' && "Go directly to jail. Do not pass GO."}
                                    {property.name === 'CHANCE' && "Draw a Chance card for a random event."}
                                    {property.name === 'COMMUNITY CHEST' && "Draw a Community Chest card."}
                                    {property.name === 'TAX' && "Pay the tax to the bank."}
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity onPress={onClose} className="bg-zinc-700 py-4 items-center border-t border-zinc-600">
                        <Text className="text-white font-bold text-lg">Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
