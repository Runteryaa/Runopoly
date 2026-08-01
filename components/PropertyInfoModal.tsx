import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useGameStore, Property } from '../store/gameStore';

import { socket } from '../utils/socket';
import { useTranslation } from '../utils/i18n';

interface PropertyInfoModalProps {
    propertyId: string | null;
    onClose: () => void;
    onTradePress?: (ownerId: string, propertyId: string) => void;
    myPlayerId?: string;
    lobbyCode?: string;
}

export default function PropertyInfoModal({ propertyId, onClose, onTradePress, myPlayerId, lobbyCode }: PropertyInfoModalProps) {
    const { properties, gamePlayers } = useGameStore();
    const { t } = useTranslation();
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
    
    const isMortgaged = property.isMortgaged === true;
    const anyMortgaged = sameColorProps.some(p => p.isMortgaged === true);
    
    const canBuildHouse = currentBldgs < 4;
    const canBuildHotel = currentBldgs === 4 && minBldgsInSet >= 4;
    const canBuild = hasFullSet && !anyMortgaged && (canBuildHouse || canBuildHotel);
    
    const isUnimproved = (property.houses || 0) === 0 && (property.hotels || 0) === 0;
    const currentRent = isUnimproved && hasFullSet && !anyMortgaged ? property.rent * 2 : property.rent;
    const houseCost = Math.max(50, Math.floor(property.price / 100) * 50);

    const totalHouses = properties.reduce((acc, p) => acc + Math.max(0, p.houses || 0), 0);
    const totalHotels = properties.reduce((acc, p) => acc + Math.max(0, p.hotels || 0), 0);
    const isHotelNext = currentBldgs === 4;
    const hasEnoughStock = isHotelNext ? (totalHotels < 12) : (totalHouses < 32);

    const isStation = property.name === 'STATION';
    const isUtility = property.name === 'UTILITY';
    const isBuildable = !isStation && !isUtility;

    const handleBuild = () => {
        if (!lobbyCode || !myPlayerId || !hasEnoughStock) return;
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
        socket.emit('toggle_mortgage', {
            lobbyCode,
            propertyId: property.id,
            isMortgaged: true,
            cost: (property.price / 2)
        });
    };

    const handleUnmortgage = () => {
        if (!lobbyCode || !myPlayerId) return;
        const mortgageTurns = property.mortgageTurns || 0;
        const baseUnmortgageCost = property.price / 2;
        const interestRate = 0.10 + Math.max(0, mortgageTurns) * 0.01;
        const cost = Math.floor(baseUnmortgageCost * (1 + interestRate));

        socket.emit('toggle_mortgage', {
            lobbyCode,
            propertyId: property.id,
            isMortgaged: false,
            cost: -cost
        });
    };

    return (
        <Modal visible={!!propertyId} animationType="fade" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-6">
                <View className="bg-zinc-800 rounded-3xl border border-zinc-700 w-full overflow-hidden shadow-2xl">
                    {!isSpecial && (
                        <View style={{ backgroundColor: property.color }} className="w-full py-4 items-center border-b border-black/20">
                            <Text className="text-black/50 font-black text-[10px] uppercase tracking-widest mb-1">{t('titleDeed')}</Text>
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
                                    <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{t('owner')}</Text>
                                    {owner ? (
                                        <View className="flex-row items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700">
                                            <View style={{ backgroundColor: owner.color }} className="w-3 h-3 rounded-full" />
                                            <Text className="text-white font-bold">{owner.name}</Text>
                                        </View>
                                    ) : (
                                        <Text className="text-zinc-500 font-bold italic">{t('unowned')}</Text>
                                    )}
                                </View>

                                <View className="bg-zinc-900 rounded-xl p-4 border border-zinc-700 mb-6">
                                    {isMortgaged ? (
                                        <View className="py-4 items-center">
                                            <Text className="text-red-500 font-black text-xl uppercase tracking-widest">{t('mortgaged')}</Text>
                                            <Text className="text-zinc-500 font-bold text-xs mt-1">{t('propertyCollectsNoRent')}</Text>
                                        </View>
                                    ) : isStation ? (
                                        <>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('rent1Station')}</Text>
                                                <Text className="text-emerald-400 font-black">$25</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('rent2Stations')}</Text>
                                                <Text className="text-emerald-400 font-bold">$50</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('rent3Stations')}</Text>
                                                <Text className="text-emerald-400 font-bold">$100</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-orange-400 font-black">{t('rent4Stations')}</Text>
                                                <Text className="text-emerald-400 font-black">$200</Text>
                                            </View>
                                        </>
                                    ) : isUtility ? (
                                        <>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('rent1Utility')}</Text>
                                                <Text className="text-emerald-400 font-bold">{t('diceRoll4x')}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-orange-400 font-black">{t('rent2Utilities')}</Text>
                                                <Text className="text-emerald-400 font-black">{t('diceRoll10x')}</Text>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <View className="flex-row items-center gap-1">
                                                    <Text className="text-zinc-400 font-bold">{t('rent')}</Text>
                                                    {isUnimproved && hasFullSet && (
                                                        <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/50">
                                                            <Text className="text-emerald-400 text-[8px] font-black uppercase">{t('colorSet2x')}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text className="text-emerald-400 font-black">${currentRent}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('with1House')}</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 2}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('with2Houses')}</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 3}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('with3Houses')}</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 4}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-zinc-400 font-bold">{t('with4Houses')}</Text>
                                                <Text className="text-emerald-400 font-bold">${property.rent * 5}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-zinc-800">
                                                <Text className="text-orange-400 font-black">{t('withHotel')}</Text>
                                                <Text className="text-emerald-400 font-black">${property.rent * 6}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>

                                {isBuildable && (
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-zinc-500 font-bold text-xs uppercase">{t('houseCost')}</Text>
                                        <Text className="text-zinc-300 font-bold">${t('each', { cost: houseCost })}</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between items-center mt-1">
                                    <Text className="text-zinc-500 font-bold text-xs uppercase">{t('propertyPrice')}</Text>
                                    <Text className="text-white font-black">${property.price}</Text>
                                </View>

                                {owner && myPlayerId && owner.id !== myPlayerId && onTradePress && (
                                    <TouchableOpacity 
                                        onPress={() => onTradePress(owner.id, property.id)} 
                                        className="bg-emerald-500/20 border border-emerald-500 py-3 rounded-xl items-center mt-6"
                                    >
                                        <Text className="text-emerald-500 font-black text-sm uppercase tracking-widest">{t('tradeWithBtn', { name: owner.name })}</Text>
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
                                                    {t('unmortgageCostBtn', { cost: Math.floor((property.price / 2) * (1 + 0.10 + Math.max(0, property.mortgageTurns || 0) * 0.01)) })}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <>
                                                {isBuildable && (
                                                    <>
                                                        {!hasFullSet ? (
                                                            <Text className="text-zinc-500 text-xs text-center font-bold">{t('needFullColorSet')}</Text>
                                                        ) : anyMortgaged ? (
                                                            <Text className="text-zinc-500 text-xs text-center font-bold">{t('cannotBuildMortgaged')}</Text>
                                                        ) : canBuild ? (
                                                            <>
                                                                <TouchableOpacity 
                                                                    onPress={handleBuild}
                                                                    disabled={!hasEnoughStock}
                                                                    className={`${hasEnoughStock ? 'bg-blue-500 border-blue-700' : 'bg-zinc-700 border-zinc-600'} py-3 rounded-xl items-center border-b-4`}
                                                                >
                                                                    <Text className="text-white font-black text-sm uppercase tracking-widest">
                                                                        {t('buildTypeCostBtn', { type: currentBldgs === 4 ? t('hotel') : t('house'), cost: houseCost })}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                                {!hasEnoughStock && (
                                                                    <Text className="text-red-400 text-xs text-center font-bold mt-1">{t('bankOutOf', { type: isHotelNext ? t('hotels') : t('houses') })}</Text>
                                                                )}
                                                            </>
                                                        ) : currentBldgs === 5 ? (
                                                            <Text className="text-emerald-500 text-xs text-center font-bold">{t('fullyUpgraded')}</Text>
                                                        ) : (
                                                            <Text className="text-zinc-500 text-xs text-center font-bold">{t('need4HousesForHotel')}</Text>
                                                        )}
                                                        
                                                        {currentBldgs > 0 && (
                                                            <TouchableOpacity 
                                                                onPress={handleSell}
                                                                className="bg-red-500/20 border border-red-500 py-3 rounded-xl items-center"
                                                            >
                                                                <Text className="text-red-500 font-black text-sm uppercase tracking-widest">
                                                                    {t('sellTypeCostBtn', { type: currentBldgs === 5 ? t('hotel') : t('house'), cost: houseCost / 2 })}
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
                                                            {t('mortgageCostBtn', { cost: property.price / 2 })}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                                {maxBldgsInSet > 0 && isBuildable && (
                                                    <Text className="text-zinc-500 text-xs text-center font-bold mt-2">{t('sellBuildingsToMortgage')}</Text>
                                                )}
                                            </>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View className="py-4 items-center">
                                <Text className="text-zinc-400 text-center leading-relaxed">
                                    {property.name === 'GO' && t('goDesc')}
                                    {property.name === 'JAIL' && t('jailDesc')}
                                    {property.name === 'PARKING' && t('parkingDesc')}
                                    {property.name === 'GO TO JAIL' && t('goToJailDesc')}
                                    {property.name === 'CHANCE' && t('chanceDesc')}
                                    {property.name === 'COMMUNITY CHEST' && t('communityChestDesc')}
                                    {property.name === 'TAX' && t('taxDesc')}
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity onPress={onClose} className="bg-zinc-700 py-4 items-center border-t border-zinc-600">
                        <Text className="text-white font-bold text-lg">{t('close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
