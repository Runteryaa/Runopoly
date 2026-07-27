import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useEffect, useState } from 'react';
import TradeModal from '../components/TradeModal';
import IncomingTradeModal from '../components/IncomingTradeModal';
import InventoryModal from '../components/InventoryModal';

export default function GameBoard() {
  const { properties, gamePlayers, lobbyCode, updatePlayerPosition, playerName, activeTurnId, setActiveTurnId, rules } = useGameStore();
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [incomingTrade, setIncomingTrade] = useState<TradeData | null>(null);

  const myPlayer = gamePlayers.find(p => p.name === playerName);
  const activePlayer = gamePlayers.find(p => p.id === activeTurnId);
  const isMyTurn = myPlayer?.id === activeTurnId;

  useEffect(() => {
    socket.on('player_moved', ({ playerId, steps }) => {
      updatePlayerPosition(playerId, steps);
    });
    
    socket.on('turn_changed', (nextPlayerId) => {
      setActiveTurnId(nextPlayerId);
      setLastRoll(null);
    });

    socket.on('property_bought', ({ propertyId, ownerId, price }) => {
      useGameStore.getState().buyProperty(propertyId, ownerId, price);
    });

    socket.on('rent_paid', ({ fromPlayerId, toPlayerId, amount }) => {
      useGameStore.getState().payRent(fromPlayerId, toPlayerId, amount);
    });

    socket.on('property_upgraded', ({ propertyId, houses, hotels, cost }) => {
      useGameStore.getState().upgradeProperty(propertyId, houses, hotels, cost);
    });

    socket.on('passed_go', (playerId) => {
      useGameStore.getState().passedGo(playerId);
    });

    socket.on('card_executed', ({ playerId, card }) => {
      useGameStore.getState().executeCard(playerId, card);
    });

    socket.on('went_to_jail', (playerId) => {
      useGameStore.getState().setJailStatus(playerId, true);
    });

    socket.on('left_jail', (playerId) => {
      useGameStore.getState().setJailStatus(playerId, false);
    });

    socket.on('trade_proposed', (trade: TradeData) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === playerName);
        if (me && trade.toId === me.id) {
            setIncomingTrade(trade);
        }
    });

    socket.on('trade_responded', ({ trade, accepted }) => {
        if (accepted) {
            useGameStore.getState().executeTrade(trade);
            Alert.alert('Trade Accepted', 'The trade was successfully completed!');
        } else {
            const me = useGameStore.getState().gamePlayers.find(p => p.name === playerName);
            if (me && trade.fromId === me.id) {
                Alert.alert('Trade Rejected', 'The other player declined your trade proposal.');
            }
        }
    });

    return () => {
      socket.off('player_moved');
      socket.off('turn_changed');
      socket.off('property_bought');
      socket.off('rent_paid');
      socket.off('passed_go');
      socket.off('card_executed');
      socket.off('went_to_jail');
      socket.off('left_jail');
      socket.off('trade_proposed');
      socket.off('trade_responded');
    };
  }, []);

  const handleRollDice = () => {
    if (!isMyTurn || !myPlayer) return;

    if (myPlayer.inJail) {
        Alert.alert(
            'Busted!',
            'You are in Jail. What do you want to do?',
            [
                { text: 'Wait', style: 'cancel', onPress: () => {
                    socket.emit('roll_dice', { lobbyCode, playerId: myPlayer.id, steps: 0 }); // Skip turn
                }},
                { text: `Pay $${rules.jailFine} & Roll`, onPress: () => {
                    socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card: { id: 'jail_fee', type: 'chance', action: 'pay', amount: rules.jailFine, text: 'Bribe the guards' } });
                    socket.emit('leave_jail', { lobbyCode, playerId: myPlayer.id });
                    
                    const dice1 = Math.floor(Math.random() * 6) + 1;
                    const dice2 = Math.floor(Math.random() * 6) + 1;
                    const totalSteps = dice1 + dice2;
                    setLastRoll(totalSteps);
                    socket.emit('roll_dice', { lobbyCode, playerId: myPlayer.id, steps: totalSteps });
                }}
            ]
        );
        return;
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const totalSteps = dice1 + dice2;
    setLastRoll(totalSteps);
    socket.emit('roll_dice', { lobbyCode, playerId: myPlayer.id, steps: totalSteps });

    const passedGo = myPlayer.position + totalSteps >= 40;
    const newPosition = (myPlayer.position + totalSteps) % 40;

    if (passedGo && newPosition !== 0) {
        socket.emit('pass_go', { lobbyCode, playerId: myPlayer.id });
    }

    const landedProperty = properties[newPosition];

    setTimeout(() => {
        if (newPosition === 30) {
            Alert.alert('Arrested!', `Go directly to Jail! Do not pass GO, do not collect $${rules.goSalary}.`);
            socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer.id });
            return;
        }

        if (newPosition === 7 || newPosition === 22 || newPosition === 36) {
            const { cards } = useGameStore.getState();
            if (cards.length > 0) {
                const randomCard = cards[Math.floor(Math.random() * cards.length)];
                Alert.alert('Chance Card!', randomCard.text);
                socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card: randomCard });
            } else {
                Alert.alert('Chance!', 'Nothing happened. No cards in deck.');
            }
            return;
        }

        if (!landedProperty.ownerId && landedProperty.price > 0 && newPosition !== 0 && newPosition !== 10) {
            Alert.alert(
                'Buy Property',
                `Do you want to buy ${landedProperty.name} for $${landedProperty.price}?`,
                [
                    { text: 'No, skip', style: 'cancel' },
                    { text: 'Buy', onPress: () => {
                        socket.emit('buy_property', { lobbyCode, propertyId: landedProperty.id, ownerId: myPlayer.id, price: landedProperty.price });
                    }}
                ]
            );
        } else if (landedProperty.ownerId && landedProperty.ownerId !== myPlayer.id) {
            const rentToPay = landedProperty.rent * (1 + (landedProperty.houses || 0) + (landedProperty.hotels || 0) * 5);
            Alert.alert('Rent Due', `You landed on ${landedProperty.name}. You must pay $${rentToPay} to the owner!`);
            socket.emit('pay_rent', { lobbyCode, fromPlayerId: myPlayer.id, toPlayerId: landedProperty.ownerId, amount: rentToPay });
        }
    }, 800);
  };

  const tileSize = 50;
  const boardSize = tileSize * 11;

  const getTileStyle = (index: number) => {
    let top = 0; let left = 0;
    if (index < 11) { top = boardSize - tileSize; left = boardSize - (index + 1) * tileSize; }
    else if (index < 20) { top = boardSize - (index - 10 + 1) * tileSize; left = 0; }
    else if (index < 31) { top = 0; left = (index - 20) * tileSize; }
    else { top = (index - 30) * tileSize; left = boardSize - tileSize; }
    return { position: 'absolute' as const, top, left, width: tileSize, height: tileSize };
  };

  return (
    <View className="flex-1 bg-zinc-900 items-center justify-center">
      <View className="absolute top-16 left-6 z-10 w-full pr-12 flex-row justify-between items-center">
         <View>
            <Text className="text-white text-2xl font-black tracking-widest">RUN<Text className="text-emerald-500">OPOLY</Text></Text>
            <Text className="text-zinc-400 font-bold text-[10px] uppercase mt-1">Lobby: {lobbyCode} • Turn: {activePlayer?.name}</Text>
         </View>
         <View className="items-end">
            <TouchableOpacity onPress={() => setInventoryVisible(true)}>
                <Text className="text-emerald-400 font-black text-xl">${myPlayer?.money}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTradeModalVisible(true)} className="bg-zinc-800 px-4 py-1 rounded border border-zinc-700 mt-2">
                <Text className="text-zinc-300 font-bold text-xs uppercase">Trade</Text>
            </TouchableOpacity>
         </View>
      </View>

      <TradeModal visible={tradeModalVisible} onClose={() => setTradeModalVisible(false)} />
      <IncomingTradeModal trade={incomingTrade} onClose={() => setIncomingTrade(null)} />
      <InventoryModal visible={inventoryVisible} onClose={() => setInventoryVisible(false)} />

      <ScrollView horizontal bounces={false} className="flex-1 mt-32">
        <ScrollView bounces={false}>
            <View style={{ width: boardSize, height: boardSize }} className="bg-zinc-800 m-4 rounded-xl overflow-hidden border-4 border-zinc-700 relative">
                {/* Center of the board */}
                <View className="absolute top-[60px] left-[60px] right-[60px] bottom-[60px] bg-zinc-900 items-center justify-center p-8">
                    <Text className="text-zinc-700 text-5xl font-black text-center opacity-30 transform -rotate-45 mb-8">RUNOPOLY</Text>
                    
                    {lastRoll && (
                      <Text className="text-white font-bold text-lg mb-4">Rolled: {lastRoll}</Text>
                    )}

                    {isMyTurn ? (
                      <TouchableOpacity 
                        className="bg-emerald-500 px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/30"
                        onPress={handleRollDice}
                      >
                        <Text className="text-white font-black text-lg">ROLL DICE</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="bg-zinc-800 px-6 py-4 rounded-2xl border border-zinc-700">
                        <Text className="text-zinc-400 font-black text-sm">Waiting for {activePlayer?.name}...</Text>
                      </View>
                    )}
                </View>

                {/* Tiles */}
                {properties.map((prop, i) => {
                    const style = getTileStyle(i);
                    // Find players on this tile
                    const playersOnTile = gamePlayers.filter(p => p.position === i);
                    const isCorner = i === 0 || i === 10 || i === 20 || i === 30;
                    
                    return (
                        <View key={prop.id} style={style} className={`border border-zinc-700/50 p-1 items-center justify-between ${isCorner ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
                            {!isCorner && <View style={{ backgroundColor: prop.color }} className="w-full h-4 rounded-sm" />}
                            
                            {isCorner ? (
                                <Text className={`text-xs font-black uppercase text-center mt-2 ${i === 0 ? 'text-emerald-400' : i === 10 ? 'text-orange-400' : i === 30 ? 'text-red-400' : 'text-blue-400'}`}>{prop.name}</Text>
                            ) : (
                                <Text className="text-white text-[10px] text-center font-bold numberOfLines={2}">{prop.name}</Text>
                            )}
                            
                            <View className="flex-row gap-1 flex-wrap justify-center w-full px-1">
                                {playersOnTile.map(p => (
                                    <View key={p.id} style={{ backgroundColor: p.color }} className="w-4 h-4 rounded-full border-2 border-zinc-900 items-center justify-center">
                                      <Text className="text-[6px] text-white font-black">{p.name.substring(0, 2).toUpperCase()}</Text>
                                    </View>
                                ))}
                            </View>

                            {!isCorner && (
                                <View className="flex-row gap-[1px] absolute top-5 left-1 right-1 justify-center">
                                    {Array.from({ length: prop.houses || 0 }).map((_, idx) => (
                                        <View key={idx} className="w-2 h-2 bg-emerald-500 rounded-sm border border-black" />
                                    ))}
                                    {prop.hotels === 1 && (
                                        <View className="w-2 h-2 bg-red-500 rounded-sm border border-black" />
                                    )}
                                </View>
                            )}

                            {!isCorner && <Text className="text-zinc-400 text-[8px] font-bold pb-1">${prop.price}</Text>}

                            {prop.ownerId && !isCorner && (
                                <View style={{ backgroundColor: gamePlayers.find(p => p.id === prop.ownerId)?.color }} className="w-full h-1 absolute bottom-0" />
                            )}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
