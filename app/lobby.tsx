import { CustomAlert } from '../utils/alert';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { socket } from '../utils/socket';
import { useGameStore, AVAILABLE_CHARACTERS } from '../store/gameStore';
import { useTranslation } from '../utils/i18n';

export default function Lobby() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isHost, setIsHost] = useState(params.isHost === 'true');
  const { playerName, rules, properties, cards, setRules, setAllProperties, setAllCards } = useGameStore();
  const [roomCode] = useState((params.code as string) || Math.random().toString(36).substring(2, 6).toUpperCase());
  const [myId] = useState(() => Math.random().toString());
  const [players, setPlayers] = useState<any[]>([]);
  const playersRef = useRef<any[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [localRules, setLocalRules] = useState(rules);
  const [isPublic, setIsPublic] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
      setLocalRules(rules);
  }, [rules]);

  useEffect(() => {
    socket.connect();
    
    const timeout = setTimeout(() => {
        if (!socket.connected) {
            CustomAlert.alert(t('connectionFailed'), t('connectionFailedDesc'));
            router.back();
        }
    }, 5000);
    
    const myUser = { id: myId, name: playerName, ready: true, isHost };
    playersRef.current = [myUser];
    setPlayers(playersRef.current);

    if (isHost) {
        socket.emit('create_lobby', { 
            lobbyCode: roomCode, 
            user: myUser, 
            config: { rules, properties, cards },
            isPublic
        });
    } else {
        socket.emit('join_lobby', { lobbyCode: roomCode, user: myUser });
    }

    socket.on('sync_config', (config) => {
        if (config.rules) setRules(config.rules);
        if (config.properties) setAllProperties(config.properties);
        if (config.cards) setAllCards(config.cards);
    });

    socket.on('reconnected', ({ user, isHost: serverIsHost, isStarted }) => {
        setIsHost(serverIsHost);
    });

    socket.on('host_transferred', (newHostName) => {
        if (playerName === newHostName) {
            setIsHost(true);
            CustomAlert.alert(t('hostTransfer'), t('hostTransferDesc'));
        }
    });

    socket.on('server_error', (msg) => {
        CustomAlert.alert(t('error'), msg);
        router.back();
    });

    socket.on('lobby_state', (currentPlayers) => {
        playersRef.current = currentPlayers;
        setPlayers(playersRef.current);
        const me = currentPlayers.find((p: any) => p.id === myId);
        if (me) {
            setIsHost(me.isHost);
        }
    });

    socket.on('player_joined', (user) => {
        if (!playersRef.current.find(p => p.id === user.id || p.name === user.name)) {
            playersRef.current = [...playersRef.current, user];
            setPlayers(playersRef.current);
        }
    });

    socket.on('game_started', ({ firstTurnName, isReconnect }) => {
        if (!isReconnect) {
            useGameStore.getState().setGamePlayers(playersRef.current);
            useGameStore.getState().setActiveTurnName(firstTurnName);
        }
        useGameStore.getState().setLobbyCode(roomCode);
        router.push('/game');
    });

    socket.on('kicked_from_lobby', (kickedId) => {
        if (myId === kickedId) {
            CustomAlert.alert(t('kicked'), t('kickedDesc'));
            router.back();
        }
    });

    return () => {
        clearTimeout(timeout);
        socket.off('lobby_state');
        socket.off('player_joined');
        socket.off('game_started');
        socket.off('sync_config');
        socket.off('reconnected');
        socket.off('host_transferred');
        socket.off('server_error');
        socket.off('kicked_from_lobby');
        socket.disconnect();
    };
  }, []);

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="px-6 pb-4 border-b border-zinc-800 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-black">{t('gameLobby')}</Text>
        <View className="flex-row gap-2">
            {isHost && (
                <TouchableOpacity onPress={() => setSettingsVisible(true)} className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">
                  <Text className="text-zinc-400 font-bold">{t('rulesSettings')}</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.back()} className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30">
              <Text className="text-red-400 font-bold">{t('leave')}</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Modal visible={settingsVisible} animationType="slide" transparent>
          <View className="flex-1 bg-zinc-900/95 justify-center p-4">
              <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700">
                  <Text className="text-white text-2xl font-black mb-4">{t('gameRules')}</Text>
                  <ScrollView className="max-h-[70vh]">
                      <View className="mb-4">
                          <Text className="text-zinc-400 font-bold mb-1">{t('startingMoney')}</Text>
                          <TextInput 
                              className="bg-zinc-900 text-white p-3 rounded-lg border border-zinc-700"
                              keyboardType="numeric"
                              value={localRules.startingMoney.toString()}
                              onChangeText={(t) => setLocalRules({...localRules, startingMoney: parseInt(t) || 0})}
                          />
                      </View>
                      <View className="mb-4">
                          <Text className="text-zinc-400 font-bold mb-1">{t('goSalary')}</Text>
                          <TextInput 
                              className="bg-zinc-900 text-white p-3 rounded-lg border border-zinc-700"
                              keyboardType="numeric"
                              value={localRules.goSalary.toString()}
                              onChangeText={(t) => setLocalRules({...localRules, goSalary: parseInt(t) || 0})}
                          />
                      </View>
                      <View className="mb-4">
                          <Text className="text-zinc-400 font-bold mb-1">{t('incomeTax')}</Text>
                          <TextInput 
                              className="bg-zinc-900 text-white p-3 rounded-lg border border-zinc-700"
                              keyboardType="numeric"
                              value={localRules.incomeTax.toString()}
                              onChangeText={(t) => setLocalRules({...localRules, incomeTax: parseInt(t) || 0})}
                          />
                      </View>
                      <View className="mb-4">
                          <Text className="text-zinc-400 font-bold mb-1">{t('jailFine')}</Text>
                          <TextInput 
                              className="bg-zinc-900 text-white p-3 rounded-lg border border-zinc-700"
                              keyboardType="numeric"
                              value={localRules.jailFine.toString()}
                              onChangeText={(t) => setLocalRules({...localRules, jailFine: parseInt(t) || 0})}
                          />
                      </View>
                      <View className="mb-4 flex-row justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-700">
                          <Text className="text-zinc-300 font-bold">{t('speedDieDesc')}</Text>
                          <Switch 
                              value={localRules.speedDie} 
                              onValueChange={(v) => setLocalRules({...localRules, speedDie: v})}
                              trackColor={{ false: '#3f3f46', true: '#10b981' }}
                          />
                      </View>
                  </ScrollView>
                  <View className="flex-row gap-3 mt-4">
                      <TouchableOpacity onPress={() => setSettingsVisible(false)} className="flex-1 bg-zinc-700 py-3 rounded-xl items-center">
                          <Text className="text-white font-bold">{t('cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                            setRules(localRules);
                            setSettingsVisible(false);
                            socket.emit('update_config', { lobbyCode: roomCode, config: { rules: localRules, properties: useGameStore.getState().properties, cards: useGameStore.getState().cards } });
                        }} 
                        className="flex-1 bg-emerald-500 py-3 rounded-xl items-center"
                      >
                          <Text className="text-white font-bold">{t('saveRules')}</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      <View className="items-center mt-8 mb-8">
        <Text className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">{t('roomCode')}</Text>
        <View className="bg-zinc-800 px-8 py-4 rounded-2xl border border-zinc-700/50 shadow-sm mb-3">
            <Text className="text-emerald-400 text-4xl font-black tracking-widest">{roomCode}</Text>
        </View>
        <Text className="text-zinc-500 text-xs text-center px-6">{t('shareCodeDesc')}</Text>
        
        {isHost && (
            <View className="flex-row items-center gap-3 mt-4 bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700/30">
                <Text className="text-zinc-300 font-bold">{t('publicLobby')}</Text>
                <Switch 
                    value={isPublic} 
                    onValueChange={(v) => {
                        setIsPublic(v);
                        socket.emit('set_public_lobby', { lobbyCode: roomCode, isPublic: v });
                    }}
                    trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                />
            </View>
        )}
      </View>

      <Text className="px-6 text-zinc-500 font-bold mb-4 uppercase tracking-widest">{t('players')} ({players.length}/4)</Text>
      <ScrollView className="flex-1 px-4">
        {players.map((player) => (
            <View key={player.id} className="bg-zinc-800 p-4 rounded-2xl mb-3 flex-row justify-between items-center border border-zinc-700/30">
                <View className="flex-row items-center gap-2">
                    <Text className="text-2xl mr-1">{player.character || '?'}</Text>
                    <Text className="text-white font-bold text-lg">{player.name}</Text>
                    {player.isHost && (
                        <View className="bg-emerald-500/10 px-2 py-1 rounded-md">
                            <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">{t('host')}</Text>
                        </View>
                    )}
                </View>
                
                <View className="flex-row items-center gap-3">
                    {isHost && !player.isHost && (
                        <TouchableOpacity 
                            onPress={() => socket.emit('kick_player', { lobbyCode: roomCode, playerId: player.id })}
                            className="bg-red-500/20 px-3 py-1 rounded-full"
                        >
                            <Text className="text-red-500 font-bold text-xs uppercase tracking-widest">{t('kick')}</Text>
                        </TouchableOpacity>
                    )}
                    {player.ready ? (
                        <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                            <Text className="text-emerald-500 font-bold text-xs uppercase">{t('ready')}</Text>
                        </View>
                    ) : (
                        <View className="bg-zinc-700 px-3 py-1 rounded-full">
                            <Text className="text-zinc-400 font-bold text-xs uppercase">{t('waiting')}</Text>
                        </View>
                    )}
                </View>
            </View>
        ))}
      </ScrollView>

      <Text className="px-6 text-zinc-500 font-bold mb-2 mt-2 uppercase tracking-widest text-center">{t('selectCharacter')}</Text>
      <View className="px-6 flex-row justify-between mb-4">
        {AVAILABLE_CHARACTERS.map(char => {
            const isTakenByOther = players.some(p => p.id !== myId && p.character === char);
            const isMine = players.find(p => p.id === myId)?.character === char;
            return (
                <TouchableOpacity 
                    key={char} 
                    disabled={isTakenByOther}
                    onPress={() => socket.emit('change_character', { lobbyCode: roomCode, playerId: myId, character: char })}
                    className={`w-12 h-12 rounded-full items-center justify-center border-2 ${isMine ? 'border-emerald-500 bg-emerald-500/20' : isTakenByOther ? 'border-zinc-800 bg-zinc-800/50 opacity-30' : 'border-zinc-700 bg-zinc-800'}`}
                >
                    <Text className="text-2xl">{char}</Text>
                </TouchableOpacity>
            )
        })}
      </View>

      <View className="p-6 pb-10">
        {isHost ? (
              <TouchableOpacity 
              className="w-full bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30"
              onPress={() => {
                  const state = useGameStore.getState();
                  socket.emit('update_config', { lobbyCode: roomCode, config: { rules: state.rules, properties: state.properties, cards: state.cards } });
                  socket.emit('start_game', roomCode);
              }}
            >
                <Text className="text-white font-bold text-lg">{t('startGame')}</Text>
            </TouchableOpacity>
        ) : (
            <View className="w-full bg-zinc-800 border border-zinc-700 py-4 rounded-2xl items-center">
                <Text className="text-zinc-400 font-bold text-lg">{t('waitingForHost')}</Text>
            </View>
        )}
      </View>
    </View>
  );
}
