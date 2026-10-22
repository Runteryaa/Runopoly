import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../../store/gameStore";
import { TOKENS } from "../../data/tokens";
import { socketService } from "../../services/socketService";
import { PlayerToken, GameRulesConfig } from "../../types";

interface PublicRoomItem {
  code: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  hostName: string;
}

export const LobbyScreen: React.FC = () => {
  const router = useRouter();
  const serverUrl = useGameStore((s) => s.serverUrl);
  const setServerUrl = useGameStore((s) => s.setServerUrl);
  const nickname = useGameStore((s) => s.nickname);
  const token = useGameStore((s) => s.token);
  const isConnected = useGameStore((s) => s.isConnected);
  const setPlayerProfile = useGameStore((s) => s.setPlayerProfile);
  const setSession = useGameStore((s) => s.setSession);

  const [inputNickname, setInputNickname] = useState(nickname);
  const [selectedToken, setSelectedToken] = useState<PlayerToken>(token);
  const [joinCode, setJoinCode] = useState("");
  const [serverUrlInput, setServerUrlInput] = useState(serverUrl);
  const [publicRooms, setPublicRooms] = useState<PublicRoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Host rule states
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(60);
  const [freeParkingJackpot, setFreeParkingJackpot] = useState(false);
  const [doubleGoBonus, setDoubleGoBonus] = useState(false);
  const [auctionsEnabled, setAuctionsEnabled] = useState(true);

  // Auto connect socket on mount
  useEffect(() => {
    socketService.connect(serverUrl);
    fetchPublicRooms();
  }, [serverUrl]);

  const fetchPublicRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const res = await fetch(`${serverUrl}/api/rooms`);
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // Server might still be waking up on Render
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleUpdateProfile = (newToken: PlayerToken) => {
    setSelectedToken(newToken);
    setPlayerProfile(inputNickname.trim() || "Player", newToken);
  };

  const handleCreateRoom = () => {
    const nick = inputNickname.trim() || "Player";
    setPlayerProfile(nick, selectedToken);

    const rules: Partial<GameRulesConfig> = {
      turnTimerSeconds,
      freeParkingJackpot,
      doubleGoBonus,
      auctionsEnabled,
    };

    socketService.createRoom(nick, selectedToken, rules, (res) => {
      if (res.success && res.roomCode && res.playerId) {
        setSession(res.playerId, res.roomCode);
        router.replace("/lobby");
      } else {
        setErrorMessage(res.error || "Failed to create room.");
      }
    });
  };

  const handleJoinRoom = (codeToJoin?: string) => {
    const code = (codeToJoin || joinCode).trim().toUpperCase();
    if (!code) {
      setErrorMessage("Please enter a 4-letter room code.");
      return;
    }

    const nick = inputNickname.trim() || "Player";
    setPlayerProfile(nick, selectedToken);

    socketService.joinRoom(code, nick, selectedToken, undefined, (res) => {
      if (res.success && res.playerId) {
        setSession(res.playerId, code);
        router.replace("/lobby");
      } else {
        setErrorMessage(res.error || "Failed to join room.");
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title & Tagline */}
      <View style={styles.branding}>
        <Text style={styles.brandTitle}>🎲 RUNOPOLY</Text>
        <Text style={styles.brandSubtitle}>Real-Time Online Classic Board Game</Text>
        <View style={styles.connectionStatus}>
          <Text style={[styles.statusDot, isConnected ? styles.dotGreen : styles.dotRed]}>●</Text>
          <Text style={styles.statusText}>{isConnected ? "Server Connected" : "Connecting to Server..."}</Text>
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Profile Card: Nickname & Token */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. PLAYER PROFILE</Text>

        <Text style={styles.inputLabel}>Enter Nickname:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MonopolyKing"
          placeholderTextColor="#64748b"
          value={inputNickname}
          onChangeText={(val) => {
            setInputNickname(val);
            setPlayerProfile(val, selectedToken);
          }}
        />

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Choose Your Token:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenRow}>
          {TOKENS.map((t) => {
            const isSelected = selectedToken === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tokenCard,
                  isSelected && styles.tokenCardSelected,
                  { borderColor: isSelected ? t.color : "#334155" },
                ]}
                onPress={() => handleUpdateProfile(t.id)}
              >
                <Text style={styles.tokenEmoji}>{t.emoji}</Text>
                <Text style={styles.tokenName}>{t.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Join Room Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. JOIN EXISTING ROOM</Text>
        <View style={styles.joinRow}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="CODE"
            placeholderTextColor="#64748b"
            maxLength={4}
            autoCapitalize="characters"
            value={joinCode}
            onChangeText={setJoinCode}
          />
          <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinRoom()}>
            <Text style={styles.joinBtnText}>JOIN MATCH</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Room Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. HOST A NEW ROOM</Text>

        <View style={styles.rulesContainer}>
          <View style={styles.ruleRow}>
            <View>
              <Text style={styles.ruleLabel}>Turn Timer</Text>
              <Text style={styles.ruleDesc}>{turnTimerSeconds > 0 ? `${turnTimerSeconds}s per turn` : "Unlimited time"}</Text>
            </View>
            <View style={styles.timerOptions}>
              {[30, 60, 90, 0].map((sec) => (
                <TouchableOpacity
                  key={`timer-${sec}`}
                  style={[styles.timerChip, turnTimerSeconds === sec && styles.timerChipActive]}
                  onPress={() => setTurnTimerSeconds(sec)}
                >
                  <Text style={styles.timerChipText}>{sec === 0 ? "∞" : `${sec}s`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.ruleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleLabel}>Free Parking Cash Pot</Text>
              <Text style={styles.ruleDesc}>Taxes & fines collect in center; winner takes all</Text>
            </View>
            <Switch
              value={freeParkingJackpot}
              onValueChange={setFreeParkingJackpot}
              trackColor={{ false: "#334155", true: "#10b981" }}
            />
          </View>

          <View style={styles.ruleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleLabel}>Double GO Bonus</Text>
              <Text style={styles.ruleDesc}>Landing exactly on GO awards $400 instead of $200</Text>
            </View>
            <Switch
              value={doubleGoBonus}
              onValueChange={setDoubleGoBonus}
              trackColor={{ false: "#334155", true: "#10b981" }}
            />
          </View>

          <View style={styles.ruleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleLabel}>Property Auctions</Text>
              <Text style={styles.ruleDesc}>Declined properties go to highest bidder</Text>
            </View>
            <Switch
              value={auctionsEnabled}
              onValueChange={setAuctionsEnabled}
              trackColor={{ false: "#334155", true: "#10b981" }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateRoom}>
          <Text style={styles.createBtnText}>✨ CREATE GAME ROOM</Text>
        </TouchableOpacity>
      </View>

      {/* Public Rooms Browser */}
      <View style={styles.card}>
        <View style={styles.browserHeader}>
          <Text style={styles.cardTitle}>4. PUBLIC ROOMS BROWSER</Text>
          <TouchableOpacity onPress={fetchPublicRooms}>
            <Text style={styles.refreshText}>{isLoadingRooms ? "Refreshing..." : "↻ Refresh"}</Text>
          </TouchableOpacity>
        </View>

        {isLoadingRooms ? (
          <ActivityIndicator color="#38bdf8" style={{ marginVertical: 16 }} />
        ) : publicRooms.length === 0 ? (
          <Text style={styles.noRooms}>No active waiting rooms. Host one above!</Text>
        ) : (
          publicRooms.map((rm) => (
            <View key={rm.code} style={styles.roomItem}>
              <View>
                <Text style={styles.roomCodeText}>ROOM {rm.code}</Text>
                <Text style={styles.roomHostText}>Host: {rm.hostName} • {rm.playerCount}/{rm.maxPlayers} Players</Text>
              </View>
              <TouchableOpacity style={styles.quickJoinBtn} onPress={() => handleJoinRoom(rm.code)}>
                <Text style={styles.quickJoinText}>QUICK JOIN</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Server URL Config (Render.com) */}
      <View style={[styles.card, { marginBottom: 40 }]}>
        <Text style={styles.cardTitle}>5. SERVER CONNECTION (RENDER / LOCAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="http://localhost:4000 or Render URL"
          placeholderTextColor="#64748b"
          value={serverUrlInput}
          onChangeText={setServerUrlInput}
          onSubmitEditing={() => setServerUrl(serverUrlInput.trim())}
        />
        <TouchableOpacity
          style={styles.updateUrlBtn}
          onPress={() => setServerUrl(serverUrlInput.trim())}
        >
          <Text style={styles.updateUrlText}>UPDATE SERVER URL</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  content: {
    padding: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  branding: {
    alignItems: "center",
    marginVertical: 20,
  },
  brandTitle: {
    color: "#fbbf24",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusDot: {
    fontSize: 12,
  },
  dotGreen: {
    color: "#22c55e",
  },
  dotRed: {
    color: "#ef4444",
  },
  statusText: {
    color: "#cbd5e1",
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 15,
  },
  tokenRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  tokenCard: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    minWidth: 80,
  },
  tokenCardSelected: {
    backgroundColor: "#1e3a8a",
  },
  tokenEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  tokenName: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  joinRow: {
    flexDirection: "row",
    gap: 10,
  },
  codeInput: {
    flex: 1,
    letterSpacing: 4,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 18,
  },
  joinBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  rulesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  ruleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ruleLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  ruleDesc: {
    color: "#64748b",
    fontSize: 11,
  },
  timerOptions: {
    flexDirection: "row",
    gap: 6,
  },
  timerChip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  timerChipActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#0284c7",
  },
  timerChipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  createBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  createBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  browserHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "bold",
  },
  noRooms: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
    marginVertical: 12,
  },
  roomItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  roomCodeText: {
    color: "#fbbf24",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  roomHostText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  quickJoinBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickJoinText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
  },
  updateUrlBtn: {
    backgroundColor: "#334155",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  updateUrlText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "bold",
  },
});
