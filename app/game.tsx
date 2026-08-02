import { CustomAlert } from '../utils/alert';
import { View, Text, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useEffect, useState, useRef } from 'react';
import TradeModal from '../components/TradeModal';

import IncomingTradeModal from '../components/IncomingTradeModal';
import InventoryModal from '../components/InventoryModal';
import RentPaymentModal from '../components/RentPaymentModal';
import IncomingRentOfferModal from '../components/IncomingRentOfferModal';
import AuctionModal from '../components/AuctionModal';
import PropertyInfoModal from '../components/PropertyInfoModal';
import BankruptcyModal from '../components/BankruptcyModal';
import VictoryModal from '../components/VictoryModal';
import DiceFace from '../components/DiceFace';
import { Platform } from 'react-native';
import { useTranslation, getTranslatedCardText, getTranslatedTileName } from '../utils/i18n';


const BoardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
        return (
            <View className="flex-1 w-full h-full pt-24 pb-20 items-center justify-center">
                <View 
                    style={{ 
                        overflow: 'auto', 
                        width: '100%', 
                        height: '100%', 
                        display: 'block' 
                    } as any}
                >
                    <View style={{ width: 'max-content', height: 'max-content', margin: 'auto', padding: 12 } as any}>
                        {children}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 w-full h-full overflow-hidden items-center justify-center pt-24 pb-20">
            <ScrollView 
                horizontal 
                bounces={false} 
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', minWidth: '100%' }}
                style={{ flex: 1, width: '100%' }}
            >
                <ScrollView 
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 12 }}
                    style={{ flex: 1 }}
                >
                    {children}
                </ScrollView>
            </ScrollView>
        </View>
    );
};


export default function GameBoard() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [initialTradeTarget, setInitialTradeTarget] = useState<{ ownerId: string; propertyId: string } | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [reactionToasts, setReactionToasts] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [pendingCardDraw, setPendingCardDraw] = useState<'chance' | 'community' | null>(null);
  const { t } = useTranslation();




  const addReactionToast = (senderName: string, emoji: string) => {
    const id = Math.random().toString();
    setReactionToasts(prev => [...prev.slice(-3), { id, name: senderName, emoji }]);
    setTimeout(() => {
      setReactionToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const [currentDice, setCurrentDice] = useState<{ d1: number; d2: number } | null>({ d1: 1, d2: 1 });
  const [isRolling, setIsRolling] = useState(false);


  const animatePlayerSteps = (playerId: string, totalSteps: number, onFinish?: () => void) => {
      let currentStep = 0;
      const interval = setInterval(() => {
          currentStep++;
          updatePlayerPosition(playerId, 1);
          if (currentStep >= totalSteps) {
              clearInterval(interval);
              if (onFinish) onFinish();
          }
      }, 140);
  };

  const startVisualRoll = (onFinish: (d1: number, d2: number) => void) => {
      if (isRolling) return;
      setIsRolling(true);
      const finalD1 = Math.floor(Math.random() * 6) + 1;
      const finalD2 = Math.floor(Math.random() * 6) + 1;
      
      let count = 0;
      const interval = setInterval(() => {
          count++;
          const randomD1 = Math.floor(Math.random() * 6) + 1;
          const randomD2 = Math.floor(Math.random() * 6) + 1;
          setCurrentDice({ d1: randomD1, d2: randomD2 });
          if (count > 10) {
              clearInterval(interval);
              setCurrentDice({ d1: finalD1, d2: finalD2 });
              setIsRolling(false);
              onFinish(finalD1, finalD2);
          }
      }, 60);
  };


  const myPlayer = gamePlayers.find(p => p.name === playerName);
  const activePlayer = gamePlayers.find(p => p.name === activeTurnName);
  const isMyTurn = myPlayer?.name === activeTurnName;

  useEffect(() => {
    socket.on('player_bankrupt', ({ playerId }) => {
        useGameStore.getState().resolveBankruptcy(playerId);
        if (myPlayer?.id === playerId) {
            CustomAlert.alert(t('eliminated'), t('eliminatedDesc'));
        } else {
            const bp = useGameStore.getState().gamePlayers.find(p => p.id === playerId);
            if (bp) {
                CustomAlert.alert(t('playerBankrupt'), t('playerBankruptDesc', { name: bp.name }));
            }
        }
    });

    socket.on('player_moved', ({ playerId, steps }) => {
      if (myPlayer && playerId !== myPlayer.id) {
        animatePlayerSteps(playerId, steps);
      }
    });

    socket.on('player_reaction', ({ playerId, name, emoji }) => {
      const p = useGameStore.getState().gamePlayers.find(pl => pl.id === playerId);
      const senderName = name || p?.name || 'Oyuncu';
      addReactionToast(senderName, emoji);
    });

    
    socket.on('turn_changed', (nextPlayerName) => {
      setActiveTurnName(nextPlayerName);
      setLastRoll(null);
      setHasRolled(false);
      setPendingCardDraw(null);


      const state = useGameStore.getState();
      state.incrementMortgageTurns(nextPlayerName);
      
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
          CustomAlert.alert(t('cardRevealed'), t('cardRevealedDesc', { name: player?.name, text: getTranslatedCardText(card) }), [{ text: 'OK' }]);
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
          CustomAlert.alert(t('playerEliminated'), t('playerEliminatedDesc', { name: kickedPlayer.name }));
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
          CustomAlert.alert(t('playerDisconnected'), t('playerDisconnectedDesc', { name: disconnectedPlayer.name }));
          
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
            CustomAlert.alert(t('tradeAccepted'), t('tradeAcceptedDesc'));
        } else {
            const me = useGameStore.getState().gamePlayers.find(p => p.name === useGameStore.getState().playerName);
            if (me && trade.fromId === me.id) {
                CustomAlert.alert(t('tradeRejected'), t('tradeRejectedDesc'));
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
                CustomAlert.alert(t('rentNegotiation'), t('offerAcceptedDesc', { amount: response.amount }));
            }
        } else {
            if (me && response.fromPlayerId === me.id) {
                CustomAlert.alert(t('rentNegotiation'), t('offerDeclinedDesc'));
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
            CustomAlert.alert(t('auctionEnded'), t('auctionEndedSold', { amount: data.winningBid }));
        } else {
            CustomAlert.alert(t('auctionEnded'), t('auctionEndedNoBid'));
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
            CustomAlert.alert(t('hostTransfer'), t('hostTransferDisconnectDesc'));
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
      socket.off('player_kicked');
      socket.off('player_bankrupt');
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
          CustomAlert.alert(t('emptyDeck'), t('emptyDeckDesc', { type: type.toUpperCase() }), [{ text: 'OK' }]);
          return;
      }
      const card = filtered[Math.floor(Math.random() * filtered.length)];
      
      if (card.behavior === 'instant') {
          socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card });
          CustomAlert.alert(t('cardDrawn'), t('cardDrawnAppliedDesc', { type: type.toUpperCase(), text: getTranslatedCardText(card) }), [{ text: 'OK' }]);
      } else {
          socket.emit('update_player_stats', { 
              lobbyCode, 
              playerId: myPlayer.id, 
              updates: { inventoryCards: [...(myPlayer.inventoryCards || []), card] } 
          });
          CustomAlert.alert(t('cardDrawn'), t('cardDrawnInventoryDesc', { type: type.toUpperCase(), text: getTranslatedCardText(card) }), [{ text: 'OK' }]);
      }

  };

  const handleRollDice = () => {
    if (!isMyTurn || !myPlayer) return;

    if (myPlayer.inJail) {
        const mustPay = (myPlayer.jailTurns || 0) >= 2;
        const options: any[] = [];

        if (!mustPay) {
            options.push({ text: t('rollForDoubles'), onPress: () => {
                startVisualRoll((dice1, dice2) => {
                    const totalSteps = dice1 + dice2;
                    setLastRoll(totalSteps);
                    setHasRolled(true);
                    
                    if (dice1 === dice2) {
                        CustomAlert.alert(t('lucky'), t('escapedJailDesc', { dice1, dice2 }));
                        socket.emit('leave_jail', { lobbyCode, playerId: myPlayer.id });
                        processMove(totalSteps);
                    } else {
                        CustomAlert.alert(t('unlucky'), t('stayInJailDesc', { dice1, dice2 }));
                        socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { jailTurns: (myPlayer.jailTurns || 0) + 1 } });
                    }
                });
            }});
        }

        options.push({ text: t('payAndRoll', { amount: rules.jailFine }), onPress: () => {
            socket.emit('execute_card', { lobbyCode, playerId: myPlayer.id, card: { id: 'jail_fee', type: 'chance', action: 'pay', amount: rules.jailFine, text: t('bribeGuards') } });
            socket.emit('leave_jail', { lobbyCode, playerId: myPlayer.id });
            
            startVisualRoll((dice1, dice2) => {
                const totalSteps = dice1 + dice2;
                setLastRoll(totalSteps);
                setHasRolled(true); // Don't allow rolling again immediately if they just left jail by paying
                processMove(totalSteps);
            });
        }});

        CustomAlert.alert(
            mustPay ? t('timeIsUp') : t('busted'),
            mustPay ? t('mustPayJailDesc', { amount: rules.jailFine }) : t('inJailDesc'),
            options,
            { cancelable: false }
        );
        return;
    }

    startVisualRoll((dice1, dice2) => {
        const isDouble = dice1 === dice2;
        const totalSteps = dice1 + dice2;
        setLastRoll(totalSteps);
    
        if (isDouble) {
            const newDoublesCount = (myPlayer.doublesCount || 0) + 1;
            socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { doublesCount: newDoublesCount } });
            
            if (newDoublesCount === 3) {
                CustomAlert.alert(t('speeding'), t('speedingDesc'), [{ text: 'OK' }], { cancelable: false });
                socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer.id });
                setHasRolled(true);
                return;
            } else {
                setHasRolled(false); // Can roll again
                CustomAlert.alert(t('doubles'), t('doublesDesc', { dice1, dice2 }), [{ text: t('awesome') }], { cancelable: false });
                processMove(totalSteps);
            }
        } else {
            setHasRolled(true);
            socket.emit('update_player_stats', { lobbyCode, playerId: myPlayer.id, updates: { doublesCount: 0 } });
            processMove(totalSteps);
        }
    });
  };

  const sendReaction = (emoji: string) => {
    if (!myPlayer) return;
    socket.emit('player_reaction', { lobbyCode, playerId: myPlayer.id, name: myPlayer.name, emoji });
    addReactionToast(myPlayer.name, emoji);
  };


  const processMove = (totalSteps: number) => {
    socket.emit('roll_dice', { lobbyCode, playerId: myPlayer!.id, steps: totalSteps });

    const passedGo = myPlayer!.position + totalSteps >= totalTiles;
    const newPosition = (myPlayer!.position + totalSteps) % totalTiles;

    animatePlayerSteps(myPlayer!.id, totalSteps, () => {
        if (passedGo && newPosition !== 0) {
            socket.emit('pass_go', { lobbyCode, playerId: myPlayer!.id });
        }

        const landedProperty = properties[newPosition];

        setTimeout(() => {
            setLandingMessage(t('landedOn', { name: getTranslatedTileName(landedProperty.name) }));
            setTimeout(() => setLandingMessage(null), 3000);


            if (newPosition === s * 3) {
                CustomAlert.alert(t('arrested'), t('arrestedDesc', { amount: rules.goSalary }), [{ text: 'OK' }], { cancelable: false });
                socket.emit('go_to_jail', { lobbyCode, playerId: myPlayer!.id });
                setHasRolled(true);
                return;
            }

            if (newPosition === 7 || newPosition === 22 || newPosition === 36) {
                setPendingCardDraw('chance');
                return;
            }

            if (newPosition === 2 || newPosition === 17 || newPosition === 33) {
                setPendingCardDraw('community');
                return;
            }


            if (!landedProperty.ownerId && landedProperty.price > 0 && newPosition !== 0 && newPosition !== s) {
                CustomAlert.alert(
                    t('buyProperty'),
                    t('buyPropertyDesc', { name: landedProperty.name, price: landedProperty.price }),
                    [
                        { text: t('auctionIt'), onPress: () => {
                            socket.emit('start_auction', { lobbyCode, propertyId: landedProperty.id, excludedPlayerId: myPlayer!.id });
                        }},
                        { text: t('buy'), onPress: () => {
                            socket.emit('buy_property', { lobbyCode, propertyId: landedProperty.id, ownerId: myPlayer!.id, price: landedProperty.price });
                        }}
                    ],
                    { cancelable: false }
                );
            } else if (landedProperty.ownerId && landedProperty.ownerId !== myPlayer!.id) {
                if (landedProperty.isMortgaged) {
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
                        rentMultiplier = 2;
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
        }, 200);
    });
  };


  const totalTiles = properties.length;
  const s = totalTiles / 4;
  // On web, dynamically scale tileSize so boardSize fits within available viewport
  // Header ~90px, footer ~80px, padding ~24px => ~200px reserved vertically
  const getTileSize = () => {
    if (Platform.OS === 'web') {
      const availableWidth = windowWidth - 24;  // 12px padding each side
      const availableHeight = windowHeight - 200; // header + footer
      const available = Math.min(availableWidth, availableHeight);
      const computed = Math.floor(available / (s + 1));
      return Math.min(Math.max(computed, 32), 58); // clamp between 32 and 58
    }
    return 58;
  };
  const tileSize = getTileSize();
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
    <View className="flex-1 bg-zinc-950 items-center justify-center relative overflow-hidden">
      {/* Top Header Navigation Bar */}
      <View className="absolute top-0 left-0 right-0 z-40 bg-zinc-900/95 border-b border-zinc-800 px-4 pt-10 pb-3 flex-row justify-between items-center shadow-xl">
          {/* Top Left: RUNOPOLY + Turn & Timer */}
          <View className="shrink-0 mr-2">
             <Text className="text-white text-base sm:text-xl font-black tracking-widest">RUN<Text className="text-emerald-500">OPOLY</Text></Text>
             <View className="flex-row items-center mt-0.5 gap-1">
                 <Text className="text-zinc-400 font-semibold text-[11px]" numberOfLines={1}>{activePlayer?.name || '...'}</Text>
                 {turnTimeLeft !== null && (
                     <Text className="text-red-400 font-bold text-[11px]">({turnTimeLeft}s)</Text>
                 )}
             </View>
          </View>
          
          {/* Top Right: Scrollable buttons container for narrow mobile screens */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 6 }} className="flex-shrink">
              {/* Takas */}
              <TouchableOpacity 
                 onPress={() => setTradeModalVisible(true)} 
                 className="bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg"
              >
                  <Text className="text-zinc-300 font-bold text-xs">{t('trade')}</Text>
              </TouchableOpacity>

              {/* Para ($) */}
              <TouchableOpacity 
                 onPress={() => setInventoryVisible(true)}
                 className="bg-zinc-800 border border-emerald-500/50 px-2.5 py-1.5 rounded-lg"
              >
                  <Text className="text-emerald-400 font-black text-xs">${myPlayer?.money}</Text>
              </TouchableOpacity>

              {/* Oyuncular */}
              <TouchableOpacity 
                 onPress={() => setPlayersModalVisible(true)} 
                 className="bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg"
              >
                  <Text className="text-zinc-300 font-bold text-xs">{t('players')}</Text>
              </TouchableOpacity>

              {/* Mülklerim */}
              <TouchableOpacity 
                 onPress={() => setInventoryVisible(true)} 
                 className="bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg"
              >
                  <Text className="text-zinc-300 font-bold text-xs">{t('myProperties')}</Text>
              </TouchableOpacity>
          </ScrollView>
      </View>

      {/* Flashy Reaction Toasts Overlay */}
      <View style={Platform.OS === 'web' ? { position: 'fixed' as any, top: 96, left: 16, zIndex: 9999 } : undefined} className="absolute top-20 left-4 z-50 flex-col gap-3 pointer-events-none">
          {reactionToasts.map(toast => (
              <View 
                key={toast.id} 
                className="relative flex-row items-center my-1"
              >
                  {/* Name Bubble Badge with generous right padding for emoji */}
                  <View className="bg-zinc-900/95 border-2 border-amber-400/90 pl-4 pr-14 py-2.5 rounded-2xl flex-row items-center shadow-2xl shadow-amber-500/40">
                      <Text className="text-white font-black text-sm tracking-wide">{toast.name}</Text>
                  </View>

                  {/* Huge Emoji - Half inside, half outside on the right edge */}
                  <View className="absolute -right-6 items-center justify-center z-10">
                      <Text className="text-6xl transform scale-110" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6 }}>
                          {toast.emoji}
                      </Text>
                  </View>
              </View>
          ))}
      </View>





      {/* Players Modal */}
      {playersModalVisible && (
        <View className="absolute z-50 w-full h-full bg-black/50 justify-center items-center p-4">
            <View className="bg-zinc-900 w-full rounded-3xl border border-zinc-800 p-6">
                <Text className="text-white font-black text-2xl mb-4">{t('players')}</Text>
                {gamePlayers.map(p => (
                    <View key={p.id} className="flex-row justify-between items-center bg-zinc-800 p-3 rounded-xl mb-2">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xl">{p.character || '?'}</Text>
                            <Text className={`font-bold ${p.isDisconnected ? 'opacity-50' : ''}`} style={{ color: p.color }}>
                                {p.name} {p.isDisconnected && t('offline')}
                            </Text>
                        </View>
                        <View className="flex-row gap-2">
                            {myPlayer?.isHost && p.id !== myPlayer.id && (
                                <TouchableOpacity 
                                    onPress={() => {
                                        CustomAlert.alert(t('kickPlayer'), t('kickPlayerDesc', { name: p.name }), [
                                            { text: t('cancel'), style: 'cancel' },
                                            { text: t('kick'), style: 'destructive', onPress: () => {
                                                socket.emit('kick_player', { lobbyCode, playerId: p.id });
                                            }}
                                        ]);
                                    }}
                                    className="bg-red-500/20 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-red-500 font-bold text-xs uppercase">{t('kick')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
                <TouchableOpacity onPress={() => setPlayersModalVisible(false)} className="bg-zinc-700 py-3 rounded-xl mt-4 items-center">
                    <Text className="text-white font-bold">{t('close')}</Text>
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
                    <View className="absolute top-[68px] left-[68px] right-[68px] bottom-[68px] bg-zinc-900 items-center justify-center p-8">

                    <View className="absolute inset-0 items-center justify-center pointer-events-none z-0">
                        <Text className="text-zinc-700 text-5xl font-black text-center opacity-20 transform -rotate-45">RUNOPOLY</Text>
                    </View>
                    
                    <View className="absolute top-4 left-4 flex-row gap-4 z-30">
                        <TouchableOpacity 
                            disabled={pendingCardDraw !== 'chance'}
                            onPress={() => {
                                if (pendingCardDraw === 'chance') {
                                    handleDrawCard('chance');
                                    setPendingCardDraw(null);
                                }
                            }}
                            className={`w-16 h-24 bg-orange-500 rounded-xl border-2 shadow-lg items-center justify-center ${pendingCardDraw === 'chance' ? 'border-amber-300 scale-110 shadow-orange-500/50' : 'border-white/50 opacity-60'}`}
                        >
                            <Text className="text-white font-black text-xs uppercase transform -rotate-90">Chance</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            disabled={pendingCardDraw !== 'community'}
                            onPress={() => {
                                if (pendingCardDraw === 'community') {
                                    handleDrawCard('community');
                                    setPendingCardDraw(null);
                                }
                            }}
                            className={`w-16 h-24 bg-blue-500 rounded-xl border-2 shadow-lg items-center justify-center ${pendingCardDraw === 'community' ? 'border-amber-300 scale-110 shadow-blue-500/50' : 'border-white/50 opacity-60'}`}
                        >
                            <Text className="text-white font-black text-[10px] text-center px-1 uppercase transform -rotate-90">Community</Text>
                        </TouchableOpacity>
                    </View>


                    {/* Persistent In-Center Dice Display */}
                    {currentDice && (
                      <View className="flex-row gap-3 bg-zinc-800/90 border border-zinc-700/80 px-5 py-3 rounded-2xl items-center shadow-2xl z-10">
                          <DiceFace value={currentDice.d1} size={44} color="#ffffff" dotColor="#10b981" />
                          <DiceFace value={currentDice.d2} size={44} color="#ffffff" dotColor="#10b981" />
                      </View>
                    )}

                    {lastRoll && (
                      <Text className="text-zinc-300 font-bold text-xs bg-zinc-800/90 px-3 py-1 rounded-full border border-zinc-700 z-10">{t('rolled', { amount: lastRoll })}</Text>
                    )}

                    {landingMessage && (
                      <View className="absolute z-20 bg-emerald-500 px-6 py-2 rounded-full border border-white/20 shadow-xl">
                          <Text className="text-white font-black text-center">{landingMessage}</Text>
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
                        <TouchableOpacity 
                            key={prop.id} 
                            style={style} 
                            activeOpacity={0.8}
                            onPress={() => setSelectedPropertyId(prop.id)}
                            className={`border border-zinc-700/50 p-1 items-center justify-between ${isCorner ? 'bg-zinc-700' : 'bg-zinc-800'}`}
                        >
                            {!isCorner && <View style={{ backgroundColor: prop.color }} className="w-full h-4 rounded-sm" />}
                            
                            {isCorner ? (
                                <Text
                                    numberOfLines={2}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.6}
                                    className={`text-xs font-black uppercase text-center mt-2 px-1 ${i === 0 ? 'text-emerald-400' : i === s ? 'text-orange-400' : i === s * 3 ? 'text-red-400' : 'text-blue-400'}`}
                                >
                                    {getTranslatedTileName(prop.name)}
                                </Text>
                            ) : (
                                <Text
                                    numberOfLines={2}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.55}
                                    className="text-white text-[10px] text-center font-bold leading-tight px-0.5"
                                >
                                    {getTranslatedTileName(prop.name)}
                                </Text>
                            )}

                            
                            <View className="flex-row gap-1 flex-wrap justify-center w-full px-1 z-10 absolute bottom-6">
                                {playersOnTile.map(p => (
                                    <View key={p.id} className="relative items-center justify-center">
                                      {reactions[p.id] && (
                                          <View className="absolute -top-7 bg-black/90 px-2 py-0.5 rounded-full border border-amber-400 z-50 animate-bounce shadow-lg">
                                              <Text className="text-base">{reactions[p.id]}</Text>
                                          </View>
                                      )}
                                      <View style={{ backgroundColor: p.color }} className="w-6 h-6 rounded-full border-2 border-zinc-900 items-center justify-center shadow-lg">
                                        <Text className="text-[10px]">{p.character || '?'}</Text>
                                      </View>
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
                                    <Text className="text-red-500 font-black text-[8px] transform -rotate-45">{t('mortgaged')}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
      </BoardWrapper>

      {/* Bottom Floating Control Dock */}
      <View className="absolute bottom-4 left-4 right-4 z-40 flex-row items-center justify-between pointer-events-box-none">
          {/* Left-Aligned Reaction Trigger Button & Mini Popover */}
          <View className="relative pointer-events-auto z-50">
              {/* Reaction Popover Menu */}
              {reactionPickerOpen && (
                  <View className="absolute bottom-14 left-0 bg-zinc-900/95 border border-zinc-700/80 p-2 rounded-2xl flex-row gap-1.5 shadow-2xl z-50">
                      {['🎲', '💸', '👑', '😭', '🔥', '💩', '😎', '🎉'].map(emoji => (
                          <TouchableOpacity 
                            key={emoji} 
                            onPress={() => {
                              sendReaction(emoji);
                              setReactionPickerOpen(false);
                            }} 
                            className="p-1.5 bg-zinc-800/80 rounded-xl border border-zinc-700/50 active:scale-125"
                          >
                              <Text className="text-2xl">{emoji}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              )}

              {/* Reaction Icon Toggle Button */}
              <TouchableOpacity 
                onPress={() => setReactionPickerOpen(!reactionPickerOpen)}
                className={`w-12 h-12 rounded-2xl border items-center justify-center shadow-xl active:scale-95 ${reactionPickerOpen ? 'bg-amber-500/20 border-amber-400' : 'bg-zinc-900/95 border-zinc-700/80'}`}
              >
                  <Text style={{ fontSize: 22 }} allowFontScaling={false}>{reactionPickerOpen ? '😀' : '🙂'}</Text>
              </TouchableOpacity>
          </View>

          {/* Action Button */}
          <View className="pointer-events-auto flex-1 items-end ml-4">
              {isMyTurn ? (
                pendingCardDraw ? (
                    <TouchableOpacity 
                      className="bg-amber-600 border border-amber-500/50 px-7 py-3.5 rounded-2xl shadow-xl flex-row items-center gap-2"
                      onPress={() => {
                          handleDrawCard(pendingCardDraw);
                          setPendingCardDraw(null);
                      }}
                    >
                      <Text className="text-white font-black text-base uppercase tracking-wider">
                        {t('drawCard')} ({pendingCardDraw === 'chance' ? t('chance') : t('community')})
                      </Text>
                    </TouchableOpacity>
                ) : hasRolled ? (
                    (myPlayer?.money ?? 0) >= 0 && (
                        <TouchableOpacity 
                          className="bg-rose-600 border border-rose-500/50 px-7 py-3.5 rounded-2xl shadow-xl flex-row items-center gap-2"
                          onPress={() => socket.emit('end_turn', { lobbyCode })}
                        >
                          <Text className="text-white font-black text-base uppercase tracking-wider">{t('endTurn')}</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <TouchableOpacity 
                      className="bg-emerald-600 border border-emerald-500/50 px-7 py-3.5 rounded-2xl shadow-xl flex-row items-center gap-2"
                      onPress={handleRollDice}
                    >
                      <Text className="text-white font-black text-base uppercase tracking-wider">{t('rollDice')}</Text>
                    </TouchableOpacity>
                )
              ) : (
                <View className="bg-zinc-900/95 border border-zinc-800 px-5 py-3 rounded-2xl flex-row items-center gap-2 shadow-xl">
                   <Text className="text-zinc-400 font-bold text-sm">{t('waitingFor', { name: activePlayer?.name })}</Text>
                   {myPlayer?.isHost && (
                       <TouchableOpacity 
                         onPress={() => socket.emit('end_turn', { lobbyCode })}
                         className="ml-2 bg-orange-500/20 border border-orange-500/50 px-3 py-1 rounded-lg"
                       >
                           <Text className="text-orange-400 font-bold text-xs uppercase">{t('forceEndTurn')}</Text>
                       </TouchableOpacity>
                   )}
                </View>
              )}
          </View>
      </View>


          {myPlayer?.debts && myPlayer.debts.length > 0 && (
              <TouchableOpacity 
                  className="bg-orange-500 px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/30 border border-orange-400/50"
                  onPress={() => {
                      const debt = myPlayer.debts[0];
                      if ((myPlayer?.money || 0) < debt.amount) {
                          CustomAlert.alert(t('notEnoughMoney'), t('payDebtErrorDesc', { amount: debt.amount }));
                          return;
                      }
                      
                      CustomAlert.alert(t('payDebt'), t('payDebtDesc', { amount: debt.amount }), [
                          { text: t('cancel'), style: 'cancel' },
                          { text: t('pay'), onPress: () => {
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
                  <Text className="text-white font-black text-base text-center">{t('payDebtBtn', { amount: myPlayer.debts[0].amount })}</Text>
              </TouchableOpacity>
          )}



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

      <BankruptcyModal 
        visible={(myPlayer?.money ?? 0) < 0} 
        myPlayerId={myPlayer?.id} 
        lobbyCode={lobbyCode} 
        onMortgage={() => setInventoryVisible(true)} 
      />

      <VictoryModal 
        visible={!!(gamePlayers.length > 1 && gamePlayers.filter(p => !p.isBankrupt && !p.isEliminated).length === 1)}
        winner={gamePlayers.filter(p => !p.isBankrupt && !p.isEliminated)[0] || null}
      />

    </View>
  );
}

