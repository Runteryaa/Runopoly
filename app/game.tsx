import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useEffect, useState } from 'react';
import TradeModal from '../components/TradeModal';
import IncomingTradeModal from '../components/IncomingTradeModal';
import InventoryModal from '../components/InventoryModal';
import RentPaymentModal from '../components/RentPaymentModal';
import IncomingRentOfferModal from '../components/IncomingRentOfferModal';
import AuctionModal from '../components/AuctionModal';

export default function GameBoard() {
  const { properties, gamePlayers, lobbyCode, updatePlayerPosition, playerName, activeTurnName, setActiveTurnName, rules } = useGameStore();
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [incomingTrade, setIncomingTrade] = useState<TradeData | null>(null);
  
  const [landingMessage, setLandingMessage] = useState<string | null>(null);
  const [rentPaymentTarget, setRentPaymentTarget] = useState<any>(null);
  const [incomingRentOffer, setIncomingRentOffer] = useState<any>(null);
  const [activeAuction, setActiveAuction] = useState<any>(null);

  const myPlayer = gamePlayers.find(p => p.name === playerName);
  const activePlayer = gamePlayers.find(p => p.name === activeTurnName);
  const isMyTurn = myPlayer?.name === activeTurnName;

  useEffect(() => {
    socket.on('player_moved', ({ playerId, steps }) => {
      updatePlayerPosition(playerId, steps);
    });
    
    socket.on('turn_changed', (nextPlayerName) => {
      setActiveTurnName(nextPlayerName);
      setLastRoll(null);
      setHasRolled(false);
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
      useGameStore.getState().updatePlayerStats(playerId, { jailTurns: 0, doublesCount: 0 });
    });

    socket.on('left_jail', (playerId) => {
      useGameStore.getState().setJailStatus(playerId, false);
      useGameStore.getState().updatePlayerStats(playerId, { jailTurns: 0, doublesCount: 0 });
    });

    socket.on('player_stats_updated', ({ playerId, updates }) => {
      useGameStore.getState().updatePlayerStats(playerId, updates);
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

    socket.on('custom_rent_proposed', (offer) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === playerName);
        if (me && offer.toPlayerId === me.id) {
            setIncomingRentOffer(offer);
        }
    });

    socket.on('custom_rent_responded', (response) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === playerName);
        if (response.accepted) {
            useGameStore.getState().payRent(response.fromPlayerId, response.toPlayerId, response.amount);
            if (me && (response.fromPlayerId === me.id || response.toPlayerId === me.id)) {
                Alert.alert('Rent Negotiation', `Offer of $${response.amount} was accepted!`);
            }
        } else {
            if (me && response.fromPlayerId === me.id) {
                Alert.alert('Offer Rejected', `The owner rejected your offer. You must pay the full $${response.amount}!`);
                socket.emit('pay_rent', { lobbyCode, fromPlayerId: response.fromPlayerId, toPlayerId: response.toPlayerId, amount: response.amount });
            }
        }
    });

    socket.on('auction_started', (data) => setActiveAuction(data));
    socket.on('auction_bid_placed', (data) => {
        setActiveAuction((prev: any) => prev ? { ...prev, currentBid: data.bid, highestBidderId: data.bidderId } : null);
    });
    socket.on('auction_ended', (data) => {
        setActiveAuction(null);
        if (data.winnerId) {
            useGameStore.getState().buyProperty(data.propertyId, data.winnerId, data.winningBid);
            Alert.alert('Auction Ended', `Property sold to a bidder for $${data.winningBid}!`);
        } else {
            Alert.alert('Auction Ended', 'No one bid on the property.');
        }
    });

    socket.on('peer_request_game_state', (requesterSocketId) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
        if (me && me.isHost) {
            socket.emit('send_game_state', { 
                toSocketId: requesterSocketId, 
                state: useGameStore.getState() 
            });
        }
    });

    socket.on('peer_sync_game_state', (remoteState) => {
        useGameStore.setState({
            gamePlayers: remoteState.gamePlayers,
            properties: remoteState.properties,
            cards: remoteState.cards,
            activeTurnName: remoteState.activeTurnName,
            rules: remoteState.rules,
            lobbyCode: remoteState.lobbyCode
        });
    });

    socket.on('host_transferred', (newHostName) => {
        const { gamePlayers, playerName } = useGameStore.getState();
        useGameStore.setState({
            gamePlayers: gamePlayers.map(p => ({ ...p, isHost: p.name === newHostName }))
        });
        if (playerName === newHostName) {
            Alert.alert('Host Transfer', 'The previous host disconnected. You are now the host!');
        }
    });

    if (!myPlayer || typeof myPlayer.position === 'undefined') {
        socket.emit('request_game_state', { lobbyCode });
    }

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
      socket.off('peer_request_game_state');
      socket.off('peer_sync_game_state');
      socket.off('host_transferred');
    };
  }, []);

  const handleRollDice = () => {
    if (!isMyTurn || !myPlayer) return;

    if (myPlayer.inJail) {
        const mustPay = (myPlayer.jailTurns || 0) >= 2;
        const options: any[] = [];

        if (!mustPay) {
            options.push({ text: 'Roll for Doubles', onPress: () => {
                const dice1 = Math.floor(Math.random() * 6) + 1;
                const dice2 = Math.floor(Math.random() * 6) + 1;
                const totalSteps = dice1 + dice2;
                setLastRoll(totalSteps);
                setHasRolled(true);
                
                if (dice1 === dice2) {
                    Alert.alert('Lucky!', `You rolled doubles (${dice1} & ${dice2}) and escaped Jail!`);
                    socket.emit('leave_jail', { lobbyCode, playerId: myPlayer.id });
                    processMove(totalSteps);
                } else {
                    Alert.alert('Unlucky', `You rolled ${dice1} & ${dice2}. Not doubles. You stay in Jail.`);
                    socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { jailTurns: (myPlayer.jailTurns || 0) + 1 } });
                }
            }});
        }

        options.push({ text: `Pay $${rules.jailFine} & Roll`, onPress: () => {
            socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card: { id: 'jail_fee', type: 'chance', action: 'pay', amount: rules.jailFine, text: 'Bribe the guards' } });
            socket.emit('leave_jail', { lobbyCode, playerId: myPlayer.id });
            
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const totalSteps = dice1 + dice2;
            setLastRoll(totalSteps);
            setHasRolled(true); // Don't allow rolling again immediately if they just left jail by paying
            processMove(totalSteps);
        }});

        Alert.alert(
            mustPay ? 'Time is up!' : 'Busted!',
            mustPay ? `You must pay $${rules.jailFine} to leave Jail this turn!` : 'You are in Jail. What do you want to do?',
            options
        );
        return;
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const isDouble = dice1 === dice2;
    const totalSteps = dice1 + dice2;
    setLastRoll(totalSteps);

    if (isDouble) {
        const newDoublesCount = (myPlayer.doublesCount || 0) + 1;
        socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { doublesCount: newDoublesCount } });
        
        if (newDoublesCount === 3) {
            Alert.alert('Speeding!', 'You rolled doubles 3 times in a row! Go directly to Jail!');
            socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer.id });
            setHasRolled(true);
            return;
        } else {
            setHasRolled(false); // Can roll again
            Alert.alert('Doubles!', `You rolled ${dice1} and ${dice2}! You get to roll again after your move.`);
        }
    } else {
        setHasRolled(true);
        socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { doublesCount: 0 } });
    }

    processMove(totalSteps);
  };

  const processMove = (totalSteps: number) => {
    socket.emit('roll_dice', { lobbyCode, playerId: myPlayer!.id, steps: totalSteps });

    const passedGo = myPlayer!.position + totalSteps >= totalTiles;
    const newPosition = (myPlayer!.position + totalSteps) % totalTiles;

    if (passedGo && newPosition !== 0) {
        socket.emit('pass_go', { lobbyCode, playerId: myPlayer!.id });
    }

    const landedProperty = properties[newPosition];

    setTimeout(() => {
        setLandingMessage(`You landed on ${landedProperty.name}!`);
        setTimeout(() => setLandingMessage(null), 3000);

        if (newPosition === s * 3) {
            Alert.alert('Arrested!', `Go directly to Jail! Do not pass GO, do not collect $${rules.goSalary}.`);
            socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer!.id });
            setHasRolled(true); // End their turn basically (cannot roll again even if they had doubles)
            return;
        }

        if (newPosition === 7 || newPosition === 22 || newPosition === 36) {
            const { cards } = useGameStore.getState();
            if (cards.length > 0) {
                const randomCard = cards[Math.floor(Math.random() * cards.length)];
                Alert.alert('Chance Card!', randomCard.text);
                socket.emit('execute_card', { lobbyCode, playerId: myPlayer!.id, card: randomCard });
            } else {
                Alert.alert('Chance!', 'Nothing happened. No cards in deck.');
            }
            return;
        }

        if (!landedProperty.ownerId && landedProperty.price > 0 && newPosition !== 0 && newPosition !== s) {
            Alert.alert(
                'Buy Property',
                `Do you want to buy ${landedProperty.name} for $${landedProperty.price}?`,
                [
                    { text: 'No, auction it', style: 'cancel', onPress: () => {
                        socket.emit('start_auction', { lobbyCode, propertyId: landedProperty.id, excludedPlayerId: myPlayer!.id });
                    }},
                    { text: 'Buy', onPress: () => {
                        socket.emit('buy_property', { lobbyCode, propertyId: landedProperty.id, ownerId: myPlayer!.id, price: landedProperty.price });
                    }}
                ]
            );
        } else if (landedProperty.ownerId && landedProperty.ownerId !== myPlayer!.id) {
            const rentToPay = landedProperty.rent * (1 + (landedProperty.houses || 0) + (landedProperty.hotels || 0) * 5);
            setRentPaymentTarget({
                property: landedProperty,
                ownerId: landedProperty.ownerId,
                fullRentAmount: rentToPay
            });
        }
    }, 800);
  };

  const tileSize = 50;
  const totalTiles = properties.length;
  const s = totalTiles / 4;
  const boardSize = tileSize * (s + 1);

  const getTileStyle = (index: number) => {
    let top = 0; let left = 0;
    if (index < s) { top = boardSize - tileSize; left = boardSize - (index + 1) * tileSize; }
    else if (index < s * 2) { top = boardSize - (index - s + 1) * tileSize; left = 0; }
    else if (index < s * 3) { top = 0; left = (index - s * 2) * tileSize; }
    else { top = (index - s * 3) * tileSize; left = boardSize - tileSize; }
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
      <RentPaymentModal 
        visible={!!rentPaymentTarget} 
        onClose={() => setRentPaymentTarget(null)} 
        {...rentPaymentTarget} 
        myPlayerId={myPlayer?.id} 
        lobbyCode={lobbyCode} 
      />
      <IncomingRentOfferModal 
        visible={!!incomingRentOffer} 
        offer={incomingRentOffer} 
        onClose={() => setIncomingRentOffer(null)} 
        lobbyCode={lobbyCode} 
      />
      <AuctionModal 
        visible={!!activeAuction} 
        auctionData={activeAuction} 
        onClose={() => setActiveAuction(null)} 
        lobbyCode={lobbyCode} 
        myPlayerId={myPlayer?.id} 
      />

      <ScrollView horizontal bounces={false} className="flex-1 mt-32">
        <ScrollView bounces={false}>
            <View style={{ width: boardSize, height: boardSize }} className="bg-zinc-800 m-4 rounded-xl overflow-hidden border-4 border-zinc-700 relative">
                {/* Center of the board */}
                <View className="absolute top-[60px] left-[60px] right-[60px] bottom-[60px] bg-zinc-900 items-center justify-center p-8">
                    <Text className="text-zinc-700 text-5xl font-black text-center opacity-30 transform -rotate-45 mb-8">RUNOPOLY</Text>
                    
                    {lastRoll && (
                      <Text className="text-white font-bold text-lg mb-4">Rolled: {lastRoll}</Text>
                    )}

                    {landingMessage && (
                      <View className="absolute z-20 bg-emerald-500 px-6 py-2 rounded-full mb-28 border border-white/20">
                          <Text className="text-white font-black text-center">{landingMessage}</Text>
                      </View>
                    )}

                    {isMyTurn ? (
                      hasRolled ? (
                          <TouchableOpacity 
                            className="bg-red-500 px-6 py-4 rounded-2xl shadow-lg shadow-red-500/30"
                            onPress={() => socket.emit('end_turn', { lobbyCode })}
                          >
                            <Text className="text-white font-black text-lg">END TURN</Text>
                          </TouchableOpacity>
                      ) : (
                          <TouchableOpacity 
                            className="bg-emerald-500 px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/30"
                            onPress={handleRollDice}
                          >
                            <Text className="text-white font-black text-lg">ROLL DICE</Text>
                          </TouchableOpacity>
                      )
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
                    const isCorner = i === 0 || i === s || i === s * 2 || i === s * 3;
                    
                    return (
                        <View key={prop.id} style={style} className={`border border-zinc-700/50 p-1 items-center justify-between ${isCorner ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
                            {!isCorner && <View style={{ backgroundColor: prop.color }} className="w-full h-4 rounded-sm" />}
                            
                            {isCorner ? (
                                <Text className={`text-xs font-black uppercase text-center mt-2 ${i === 0 ? 'text-emerald-400' : i === s ? 'text-orange-400' : i === s * 3 ? 'text-red-400' : 'text-blue-400'}`}>{prop.name}</Text>
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
