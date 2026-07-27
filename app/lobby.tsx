import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';

export default function Lobby() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isHost, setIsHost] = useState(params.isHost === 'true');
  const { playerName, rules, properties, cards, setRules, setAllProperties, setAllCards } = useGameStore();
  const [roomCode] = useState((params.code as string) || Math.random().toString(36).substring(2, 6).toUpperCase());
  const [players, setPlayers] = useState<any[]>([]);
  const playersRef = useRef<any[]>([]);

  useEffect(() => {
    socket.connect();
    
    const timeout = setTimeout(() => {
        if (!socket.connected) {
            Alert.alert('Connection Failed', 'Could not connect to the server. Please check your internet or server status.');
            router.back();
        }
    }, 5000);
    
    const myUser = { id: Math.random().toString(), name: playerName, ready: true, isHost };
    playersRef.current = [myUser];
    setPlayers(playersRef.current);

    if (isHost) {
        socket.emit('create_lobby', { 
            lobbyCode: roomCode, 
            user: myUser, 
            config: { rules, properties, cards } 
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
            Alert.alert('Host Transfer', 'The previous host left. You are now the host!');
        }
    });

    socket.on('server_error', (msg) => {
        Alert.alert('Error', msg);
        router.back();
    });

    socket.on('lobby_state', (currentPlayers) => {
        playersRef.current = currentPlayers;
        setPlayers(playersRef.current);
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
        if (myUser.id === kickedId) {
            Alert.alert('Kicked', 'You have been kicked from the lobby by the host.');
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
        <Text className="text-white text-2xl font-black">Game Lobby</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-4 py-2 rounded-lg">
          <Text className="text-zinc-400 font-bold">Leave</Text>
        </TouchableOpacity>
      </View>

      <View className="items-center mt-8 mb-8">
        <Text className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Room Code</Text>
        <View className="bg-zinc-800 px-8 py-4 rounded-2xl border border-zinc-700/50 shadow-sm">
            <Text className="text-emerald-400 text-4xl font-black tracking-widest">{roomCode}</Text>
        </View>
        <Text className="text-zinc-500 text-xs mt-3">Share this code with your friends</Text>
      </View>

      <Text className="px-6 text-zinc-500 font-bold mb-4 uppercase tracking-widest">Players ({players.length}/4)</Text>
      <ScrollView className="flex-1 px-4">
        {players.map((player) => (
            <View key={player.id} className="bg-zinc-800 p-4 rounded-2xl mb-3 flex-row justify-between items-center border border-zinc-700/30">
                <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold text-lg">{player.name}</Text>
                    {player.isHost && (
                        <View className="bg-emerald-500/10 px-2 py-1 rounded-md">
                            <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Host</Text>
                        </View>
                    )}
                </View>
                
                <View className="flex-row items-center gap-3">
                    {isHost && !player.isHost && (
                        <TouchableOpacity 
                            onPress={() => socket.emit('kick_player', { lobbyCode: roomCode, playerId: player.id })}
                            className="bg-red-500/20 px-3 py-1 rounded-full"
                        >
                            <Text className="text-red-500 font-bold text-xs uppercase tracking-widest">Kick</Text>
                        </TouchableOpacity>
                    )}
                    {player.ready ? (
                        <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                            <Text className="text-emerald-500 font-bold text-xs uppercase">Ready</Text>
                        </View>
                    ) : (
                        <View className="bg-zinc-700 px-3 py-1 rounded-full">
                            <Text className="text-zinc-400 font-bold text-xs uppercase">Waiting</Text>
                        </View>
                    )}
                </View>
            </View>
        ))}
      </ScrollView>

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
                <Text className="text-white font-bold text-lg">Start Game</Text>
            </TouchableOpacity>
        ) : (
            <View className="w-full bg-zinc-800 border border-zinc-700 py-4 rounded-2xl items-center">
                <Text className="text-zinc-400 font-bold text-lg">Waiting for Host to start...</Text>
            </View>
        )}
      </View>
    </View>
  );
}
