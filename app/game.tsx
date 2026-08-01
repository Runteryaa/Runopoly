import { CustomAlert } from '../utils/alert';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useEffect, useState } from 'react';
import TradeModal from '../components/TradeModal';
import LoanRequestModal from '../components/LoanRequestModal';
import IncomingTradeModal from '../components/IncomingTradeModal';
import InventoryModal from '../components/InventoryModal';
import RentPaymentModal from '../components/RentPaymentModal';
import IncomingRentOfferModal from '../components/IncomingRentOfferModal';
import AuctionModal from '../components/AuctionModal';
import PropertyInfoModal from '../components/PropertyInfoModal';
import BankruptcyModal from '../components/BankruptcyModal';
import { Platform } from 'react-native';

const BoardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
        return (
            <View style={{ overflow: 'auto', flex: 1, marginTop: 128 } as any}>
                {children}
            </View>
        );
    }
    return (
        <ScrollView horizontal bounces={false} className="flex-1 mt-32">
            <ScrollView bounces={false}>
                {children}
            </ScrollView>
        </ScrollView>
    );
};

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
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [isAwaitingLoan, setIsAwaitingLoan] = useState(false);
  const [activeAuction, setActiveAuction] = useState<any>(null);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [initialTradeTarget, setInitialTradeTarget] = useState<{ ownerId: string; propertyId: string } | null>(null);

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

      const state = useGameStore.getState();
      const me = state.gamePlayers.find(p => p.name === playerName);
      if (me && me.isHost) {
          const nextIdx = state.gamePlayers.findIndex(p => p.name === nextPlayerName);
          const previousPlayerIndex = (nextIdx - 1 + state.gamePlayers.length) % state.gamePlayers.length;
          const previousPlayer = state.gamePlayers[previousPlayerIndex];
          if (previousPlayer) {
              state.properties.forEach(p => {
                  if (p.ownerId === previousPlayer.id && (p.houses || 0) < 0) {
                      socket.emit('upgrade_property', { 
                          lobbyCode, 
                          propertyId: p.id, 
                          houses: p.houses! - 1, 
                          hotels: 0, 
                          cost: 0 
                      });
                  }
              });
          }
      }
    });

    socket.on('turn_timer_tick', (timeLeft) => {
        setTurnTimeLeft(timeLeft);
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

    socket.on('property_mortgaged', ({ propertyId, isMortgaged, cost }) => {
      useGameStore.getState().toggleMortgage(propertyId, isMortgaged, cost);
    });

    socket.on('passed_go', (playerId) => {
      useGameStore.getState().passedGo(playerId);
    });

    socket.on('card_executed', ({ playerId, card }) => {
      if (card.action === 'show') {
          const player = useGameStore.getState().gamePlayers.find(p => p.id === playerId);
          CustomAlert.alert('Card Revealed!', `${player?.name} revealed a card:\n\n${card.text}`, [{ text: 'OK' }]);
      } else {
          useGameStore.getState().executeCard(playerId, card);
      }
    });

    socket.on('went_to_jail', (playerId) => {
      useGameStore.getState().setJailStatus(playerId, true);
      useGameStore.getState().updatePlayerStats(playerId, { jailTurns: 0, doublesCount: 0 });
    });

    socket.on('left_jail', (playerId) => {
      useGameStore.getState().setJailStatus(playerId, false);
      useGameStore.getState().updatePlayerStats(playerId, { jailTurns: 0, doublesCount: 0 });
    });

    socket.on('player_kicked_ingame', (playerId) => {
      const state = useGameStore.getState();
      const kickedPlayer = state.gamePlayers.find(p => p.id === playerId);
      if (kickedPlayer) {
          CustomAlert.alert('Player Eliminated', `${kickedPlayer.name} has been eliminated from the game.`);
          // Remove player from store and reset their properties
          useGameStore.setState({
              gamePlayers: state.gamePlayers.filter(p => p.id !== playerId),
              properties: state.properties.map(p => p.ownerId === playerId ? { ...p, ownerId: null, houses: 0, hotels: 0, isMortgaged: false } : p)
          });
          if (state.playerName === kickedPlayer.name) {
              socket.disconnect();
          }
      }
    });

    socket.on('player_disconnected', (playerId) => {
      const state = useGameStore.getState();
      const disconnectedPlayer = state.gamePlayers.find(p => p.id === playerId);
      if (disconnectedPlayer) {
          CustomAlert.alert('Player Disconnected', `${disconnectedPlayer.name} has left the game.`);
          
          useGameStore.setState({
              gamePlayers: state.gamePlayers.filter(p => p.id !== playerId),
              properties: state.properties.map(p => p.ownerId === playerId ? { ...p, ownerId: null, houses: 0, hotels: 0, isMortgaged: false } : p)
          });
      }
    });

    socket.on('player_stats_updated', ({ playerId, updates }) => {
      useGameStore.getState().updatePlayerStats(playerId, updates);
    });

    socket.on('trade_proposed', (trade: TradeData) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
        if (me && trade.toId === me.id) {
            setIncomingTrade(trade);
        }
    });

    socket.on('trade_responded', ({ trade, accepted }) => {
        if (accepted) {
            useGameStore.getState().executeTrade(trade);
            CustomAlert.alert('Trade Accepted', 'The trade was successfully completed!');
        } else {
            const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
            if (me && trade.fromId === me.id) {
                CustomAlert.alert('Trade Rejected', 'The other player declined your trade proposal.');
            }
        }
    });

    socket.on('custom_rent_proposed', (offer) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
        if (me && offer.toPlayerId === me.id) {
            setIncomingRentOffer(offer);
        }
    });

    socket.on('custom_rent_responded', (response) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
        if (response.accepted) {
            useGameStore.getState().payRent(response.fromPlayerId, response.toPlayerId, response.amount);
            if (me && (response.fromPlayerId === me.id || response.toPlayerId === me.id)) {
                CustomAlert.alert('Rent Negotiation', `Offer of $${response.amount} was accepted!`);
            }
        } else {
            if (me && response.fromPlayerId === me.id) {
                CustomAlert.alert('Rent Negotiation', 'Your offer was declined.');
            }
        }
    });

    socket.on('loan_requested', ({ fromPlayerId, amount }) => {
        const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
        if (me && fromPlayerId !== me.id) {
            const requester = useGameStore.getState().gamePlayers.find(p => p.id === fromPlayerId);
            if (!requester) return;

            CustomAlert.alert(
                'Loan Request', 
                `${requester.name} is asking for a loan of $${amount}. Will you fund it?`, 
                [
                    { text: 'Decline', style: 'cancel' },
                    { text: 'Fund Loan', onPress: () => {
                        const currentMe = useGameStore.getState().gamePlayers.find(p => p.id === me.id);
                        if ((currentMe?.money || 0) < amount) {
                            CustomAlert.alert('Error', 'You do not have enough money to fund this loan.');
                            return;
                        }
                        socket.emit('respond_loan', { lobbyCode, fromPlayerId, toPlayerId: me.id, amount, accepted: true });
                    }}
                ]
            );
        }
    });

    socket.on('loan_responded', ({ fromPlayerId, toPlayerId, amount, accepted }) => {
        if (!accepted) return;
        const state = useGameStore.getState();
        const me = state.gamePlayers.find(p => p.name === playerName);
        if (!me) return;

        if (me.id === fromPlayerId) {
            setIsAwaitingLoan(false);
            const lender = state.gamePlayers.find(p => p.id === toPlayerId);
            CustomAlert.alert('Loan Accepted', `${lender?.name} funded your loan of $${amount}! You must pay it back later.`);
            
            const myDebts = me.debts ? [...me.debts] : [];
            myDebts.push({ to: toPlayerId, amount });
            
            socket.emit('update_player_stats', { lobbyCode, playerId: fromPlayerId, updates: { 
                money: me.money + amount,
                debts: myDebts
            }});
            
            const lenderMoney = lender?.money || 0;
            socket.emit('update_player_stats', { lobbyCode, playerId: toPlayerId, updates: {
                money: lenderMoney - amount
            }});
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
            CustomAlert.alert('Auction Ended', `Property sold to a bidder for $${data.winningBid}!`);
        } else {
            CustomAlert.alert('Auction Ended', 'No one bid on the property.');
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
            CustomAlert.alert('Host Transfer', 'The previous host disconnected. You are now the host!');
        }
    });

    socket.on('lobby_state', (currentPlayers) => {
        const state = useGameStore.getState();
        useGameStore.setState({
            gamePlayers: state.gamePlayers.map(gp => {
                const lp = currentPlayers.find((p: any) => p.id === gp.id);
                if (lp) {
                    return { ...gp, isDisconnected: lp.isDisconnected, isHost: lp.isHost };
                }
                return gp;
            })
        });
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
      socket.off('player_kicked_ingame');
      socket.off('turn_timer_tick');
      socket.off('property_mortgaged');
    };
  }, []);

  const handleDrawCard = (type: 'chance' | 'community') => {
      if (!myPlayer) return;
      const { cards } = useGameStore.getState();
      const filtered = cards.filter(c => c.type === type);
      if (filtered.length === 0) {
          CustomAlert.alert('Empty Deck', `No ${type} cards available in the deck.`, [{ text: 'OK' }]);
          return;
      }
      const card = filtered[Math.floor(Math.random() * filtered.length)];
      
      if (card.behavior === 'instant') {
          socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card });
          CustomAlert.alert('Card Drawn', `You drew a ${type} card:\n\n"${card.text}"\n\nThe card effect has been applied!`, [{ text: 'OK' }]);
      } else {
          socket.emit('update_player_stats', { 
              lobbyCode, 
              playerId: myPlayer.id, 
              updates: { inventoryCards: [...(myPlayer.inventoryCards || []), card] } 
          });
          CustomAlert.alert('Card Drawn', `You drew a ${type} card:\n\n"${card.text}"\n\nIt has been added to your inventory.`, [{ text: 'OK' }]);
      }
  };

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
                    CustomAlert.alert('Lucky!', `You rolled doubles (${dice1} & ${dice2}) and escaped Jail!`);
                    socket.emit('leave_jail', { lobbyCode, playerId: myPlayer.id });
                    processMove(totalSteps);
                } else {
                    CustomAlert.alert('Unlucky', `You rolled ${dice1} & ${dice2}. Not doubles. You stay in Jail.`);
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

        CustomAlert.alert(
            mustPay ? 'Time is up!' : 'Busted!',
            mustPay ? `You must pay $${rules.jailFine} to leave Jail this turn!` : 'You are in Jail. What do you want to do?',
            options,
            { cancelable: false }
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
            CustomAlert.alert('Speeding!', 'You rolled doubles 3 times in a row! Go directly to Jail!', [{ text: 'OK' }], { cancelable: false });
            socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer.id });
            setHasRolled(true);
            return;
        } else {
            setHasRolled(false); // Can roll again
            CustomAlert.alert('Doubles!', `You rolled ${dice1} and ${dice2}! You get to roll again after your move.`, [{ text: 'Awesome' }], { cancelable: false });
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
            CustomAlert.alert('Arrested!', `Go directly to Jail! Do not pass GO, do not collect $${rules.goSalary}.`, [{ text: 'OK' }], { cancelable: false });
            socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer!.id });
            setHasRolled(true); // End their turn basically (cannot roll again even if they had doubles)
            return;
        }

        if (newPosition === 7 || newPosition === 22 || newPosition === 36) {
            handleDrawCard('chance');
            return;
        }

        if (newPosition === 2 || newPosition === 17 || newPosition === 33) {
            handleDrawCard('community');
            return;
        }

        if (!landedProperty.ownerId && landedProperty.price > 0 && newPosition !== 0 && newPosition !== s) {
            CustomAlert.alert(
                'Buy Property',
                `Do you want to buy ${landedProperty.name} for $${landedProperty.price}?`,
                [
                    { text: 'No, auction it', onPress: () => {
                        socket.emit('start_auction', { lobbyCode, propertyId: landedProperty.id, excludedPlayerId: myPlayer!.id });
                    }},
                    { text: 'Buy', onPress: () => {
                        socket.emit('buy_property', { lobbyCode, propertyId: landedProperty.id, ownerId: myPlayer!.id, price: landedProperty.price });
                    }}
                ],
                { cancelable: false }
            );
        } else if (landedProperty.ownerId && landedProperty.ownerId !== myPlayer!.id) {
            if (landedProperty.isMortgaged) {
                // If the property is mortgaged, no rent is paid.
                setRentPaymentTarget(null);
                return;
            }

            const sameColorProps = properties.filter(p => p.color === landedProperty.color);
            const hasFullSet = sameColorProps.length > 0 && sameColorProps.every(p => p.ownerId === landedProperty.ownerId);
            const isUnimproved = (landedProperty.houses || 0) === 0 && (landedProperty.hotels || 0) === 0;
            
            let rentToPay = 0;
            
            if (landedProperty.name === 'STATION') {
                const ownedStations = properties.filter(p => p.name === 'STATION' && p.ownerId === landedProperty.ownerId).length;
                rentToPay = 25 * Math.pow(2, Math.max(0, ownedStations - 1));
            } else if (landedProperty.name === 'UTILITY') {
                const ownedUtilities = properties.filter(p => p.name === 'UTILITY' && p.ownerId === landedProperty.ownerId).length;
                rentToPay = totalSteps * (ownedUtilities > 1 ? 10 : 4);
            } else {
                let rentMultiplier = 1;
                if (isUnimproved && hasFullSet) {
                    rentMultiplier = 2; // Color Set Bonus
                } else {
                    rentMultiplier = 1 + (landedProperty.houses || 0) + (landedProperty.hotels || 0) * 5;
                }
                rentToPay = landedProperty.rent * rentMultiplier;
            }
            
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
            <View className="flex-row items-center mt-1">
                <Text className="text-zinc-400 font-bold text-[10px] uppercase">Lobby: {lobbyCode} • Turn: {activePlayer?.name}</Text>
                {turnTimeLeft !== null && (
                    <View className="ml-2 bg-red-500/20 px-2 py-0.5 rounded">
                        <Text className="text-red-400 font-black text-[10px]">{turnTimeLeft}s</Text>
                    </View>
                )}
            </View>
         </View>
         <View className="items-end">
            <TouchableOpacity onPress={() => setInventoryVisible(true)}>
                <Text className="text-emerald-400 font-black text-xl">${myPlayer?.money}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTradeModalVisible(true)} className="bg-zinc-800 px-4 py-1 rounded border border-zinc-700 mt-2">
                <Text className="text-zinc-300 font-bold text-xs uppercase">Trade</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPlayersModalVisible(true)} className="bg-zinc-800 px-4 py-1 rounded border border-zinc-700 mt-1">
                <Text className="text-zinc-300 font-bold text-xs uppercase">Players</Text>
            </TouchableOpacity>
         </View>
      </View>

      {/* Players Modal */}
      {playersModalVisible && (
        <View className="absolute z-50 w-full h-full bg-black/50 justify-center items-center p-4">
            <View className="bg-zinc-900 w-full rounded-3xl border border-zinc-800 p-6">
                <Text className="text-white font-black text-2xl mb-4">Players</Text>
                {gamePlayers.map(p => (
                    <View key={p.id} className="flex-row justify-between items-center bg-zinc-800 p-3 rounded-xl mb-2">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xl">{p.character || '?'}</Text>
                            <Text className={`font-bold ${p.isDisconnected ? 'opacity-50' : ''}`} style={{ color: p.color }}>
                                {p.name} {p.isDisconnected && '(Offline)'}
                            </Text>
                        </View>
                        <View className="flex-row gap-2">
                            {myPlayer?.isHost && p.id !== myPlayer.id && (
                                <TouchableOpacity 
                                    onPress={() => {
                                        CustomAlert.alert('Kick Player', `Are you sure you want to kick ${p.name}?`, [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Kick', style: 'destructive', onPress: () => {
                                                socket.emit('kick_player', { lobbyCode, playerId: p.id });
                                            }}
                                        ]);
                                    }}
                                    className="bg-red-500/20 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-red-500 font-bold text-xs uppercase">Kick</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
                <TouchableOpacity onPress={() => setPlayersModalVisible(false)} className="bg-zinc-700 py-3 rounded-xl mt-4 items-center">
                    <Text className="text-white font-bold">Close</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}

      <TradeModal 
        visible={tradeModalVisible} 
        onClose={() => { setTradeModalVisible(false); setInitialTradeTarget(null); }} 
        initialTradeTarget={initialTradeTarget}
      />
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

      <BoardWrapper>
            <View style={{ width: boardSize, height: boardSize }} className="bg-zinc-800 m-4 rounded-xl overflow-hidden border-4 border-zinc-700 relative">
                {/* Center of the board */}
                <View className="absolute top-[60px] left-[60px] right-[60px] bottom-[60px] bg-zinc-900 items-center justify-center p-8">
                    <Text className="text-zinc-700 text-5xl font-black text-center opacity-30 transform -rotate-45 mb-8">RUNOPOLY</Text>
                    
                    <View className="absolute top-4 left-4 flex-row gap-4 z-30 opacity-80">
                        <View className="w-16 h-24 bg-orange-500 rounded-xl border-2 border-white/50 shadow-lg items-center justify-center">
                            <Text className="text-white font-black text-xs uppercase transform -rotate-90">Chance</Text>
                        </View>
                        <View className="w-16 h-24 bg-blue-500 rounded-xl border-2 border-white/50 shadow-lg items-center justify-center">
                            <Text className="text-white font-black text-[10px] text-center px-1 uppercase transform -rotate-90">Community</Text>
                        </View>
                    </View>

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
                          (myPlayer?.money ?? 0) >= 0 && (
                              <TouchableOpacity 
                                className="bg-red-500 px-6 py-4 rounded-2xl shadow-lg shadow-red-500/30"
                                onPress={() => socket.emit('end_turn', { lobbyCode })}
                              >
                                <Text className="text-white font-black text-lg">END TURN</Text>
                              </TouchableOpacity>
                          )
                      ) : (
                          <TouchableOpacity 
                            className="bg-emerald-500 px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/30"
                            onPress={handleRollDice}
                          >
                            <Text className="text-white font-black text-lg">ROLL DICE</Text>
                          </TouchableOpacity>
                      )
                    ) : (
                      <View className="items-center">
                          <View className="bg-zinc-800 px-6 py-4 rounded-2xl border border-zinc-700">
                            <Text className="text-zinc-400 font-black text-sm">Waiting for {activePlayer?.name}...</Text>
                          </View>
                          {myPlayer?.isHost && (
                              <TouchableOpacity 
                                onPress={() => socket.emit('end_turn', { lobbyCode })}
                                className="mt-4 bg-orange-500/20 border border-orange-500/50 px-4 py-2 rounded-xl"
                              >
                                  <Text className="text-orange-400 font-bold text-xs uppercase tracking-widest">Force End Turn</Text>
                              </TouchableOpacity>
                          )}
                      </View>
                    )}
                    
                    {myPlayer?.debts && myPlayer.debts.length > 0 && (
                        <TouchableOpacity 
                            className="bg-orange-500 px-6 py-4 rounded-2xl shadow-lg shadow-orange-500/30 mt-4"
                            onPress={() => {
                                const debt = myPlayer.debts[0];
                                if ((myPlayer?.money || 0) < debt.amount) {
                                    CustomAlert.alert('Not Enough Money', `You need $${debt.amount} to pay off your debt to this player.`);
                                    return;
                                }
                                
                                CustomAlert.alert('Pay Debt?', `Pay $${debt.amount} to clear your debt?`, [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Pay', onPress: () => {
                                        const newDebts = myPlayer.debts.slice(1);
                                        socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { 
                                            money: myPlayer.money - debt.amount,
                                            debts: newDebts
                                        }});
                                        const lender = gamePlayers.find(p => p.id === debt.to);
                                        if (lender) {
                                            socket.emit('update_player_stats', { lobbyCode, playerId: lender.id, updates: {
                                                money: lender.money + debt.amount
                                            }});
                                        }
                                    }}
                                ]);
                            }}
                        >
                            <Text className="text-white font-black text-lg text-center">PAY DEBT (${myPlayer.debts[0].amount})</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tiles */}
                {properties.map((prop, i) => {
                    const style = getTileStyle(i);
                    // Find players on this tile
                    const playersOnTile = gamePlayers.filter(p => p.position === i);
                    const isCorner = i === 0 || i === s || i === s * 2 || i === s * 3;
                    
                    return (
                        <TouchableOpacity 
                            key={prop.id} 
                            style={style} 
                            activeOpacity={0.8}
                            onPress={() => setSelectedPropertyId(prop.id)}
                            className={`border border-zinc-700/50 p-1 items-center justify-between ${isCorner ? 'bg-zinc-700' : 'bg-zinc-800'}`}
                        >
                            {!isCorner && <View style={{ backgroundColor: prop.color }} className="w-full h-4 rounded-sm" />}
                            
                            {isCorner ? (
                                <Text className={`text-xs font-black uppercase text-center mt-2 ${i === 0 ? 'text-emerald-400' : i === s ? 'text-orange-400' : i === s * 3 ? 'text-red-400' : 'text-blue-400'}`}>{prop.name}</Text>
                            ) : (
                                <Text className="text-white text-[10px] text-center font-bold numberOfLines={2}">{prop.name}</Text>
                            )}
                            
                            <View className="flex-row gap-1 flex-wrap justify-center w-full px-1 z-10 absolute bottom-6">
                                {playersOnTile.map(p => (
                                    <View key={p.id} style={{ backgroundColor: p.color }} className="w-6 h-6 rounded-full border-2 border-zinc-900 items-center justify-center shadow-lg">
                                      <Text className="text-[10px]">{p.character || '?'}</Text>
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
                            
                            {prop.isMortgaged && (
                                <View className="absolute inset-0 bg-black/60 items-center justify-center">
                                    <Text className="text-red-500 font-black text-[8px] transform -rotate-45">MORTGAGED</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
      </BoardWrapper>

      <PropertyInfoModal 
        propertyId={selectedPropertyId} 
        onClose={() => setSelectedPropertyId(null)} 
        myPlayerId={myPlayer?.id}
        lobbyCode={lobbyCode}
        onTradePress={(ownerId, propertyId) => {
            setSelectedPropertyId(null);
            setInitialTradeTarget({ ownerId, propertyId });
            setTradeModalVisible(true);
        }}
      />
      {loanModalVisible && (
          <LoanRequestModal 
              visible={loanModalVisible} 
              onClose={() => setLoanModalVisible(false)} 
              onSubmit={(amount) => {
                  setIsAwaitingLoan(true);
                  socket.emit('request_loan', { lobbyCode, fromPlayerId: myPlayer!.id, amount });
              }} 
          />
      )}

      <BankruptcyModal 
        visible={(myPlayer?.money ?? 0) < 0} 
        myPlayerId={myPlayer?.id} 
        lobbyCode={lobbyCode} 
        onMortgage={() => setInventoryVisible(true)} 
        onBorrow={() => setLoanModalVisible(true)} 
        isAwaitingLoan={isAwaitingLoan} 
      />
    </View>
  );
}
