import { create } from "zustand";
import { GameState, PlayerToken, ChatMessage } from "../types/index.js";

export type ModalType =
  | "trade"
  | "auction"
  | "chat"
  | "deed"
  | "propertyManager"
  | null;

interface GameStoreState {
  serverUrl: string;
  sessionToken: string | null;
  playerId: string | null;
  nickname: string;
  token: PlayerToken;
  roomCode: string | null;
  isConnected: boolean;
  gameState: GameState | null;
  activeModal: ModalType;
  selectedSpaceId: number | null;
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  isMuted: boolean;
  hapticsEnabled: boolean;

  // Actions
  setServerUrl: (url: string) => void;
  setPlayerProfile: (nickname: string, token: PlayerToken) => void;
  setSession: (playerId: string, roomCode: string) => void;
  setConnected: (connected: boolean) => void;
  setGameState: (state: GameState | null) => void;
  setActiveModal: (modal: ModalType, spaceId?: number | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  markChatRead: () => void;
  toggleMute: () => void;
  toggleHaptics: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  serverUrl: "http://localhost:4000",
  sessionToken: null,
  playerId: null,
  nickname: "Player",
  token: "top_hat",
  roomCode: null,
  isConnected: false,
  gameState: null,
  activeModal: null,
  selectedSpaceId: null,
  chatMessages: [],
  unreadChatCount: 0,
  isMuted: false,
  hapticsEnabled: true,

  setServerUrl: (url) => set({ serverUrl: url }),
  setPlayerProfile: (nickname, token) => set({ nickname, token }),
  setSession: (playerId, roomCode) => set({ playerId, sessionToken: playerId, roomCode }),
  setConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) =>
    set((prev) => {
      // Auto open auction modal if auction begins
      let activeModal = prev.activeModal;
      if (gameState?.turnPhase === "AUCTION" && gameState.currentAuction) {
        activeModal = "auction";
      } else if (prev.activeModal === "auction" && !gameState?.currentAuction) {
        activeModal = null;
      }
      return { gameState, activeModal };
    }),
  setActiveModal: (modal, spaceId = null) =>
    set({ activeModal: modal, selectedSpaceId: spaceId }),
  addChatMessage: (msg) =>
    set((prev) => ({
      chatMessages: [...prev.chatMessages, msg],
      unreadChatCount: prev.activeModal === "chat" ? 0 : prev.unreadChatCount + 1,
    })),
  markChatRead: () => set({ unreadChatCount: 0 }),
  toggleMute: () => set((prev) => ({ isMuted: !prev.isMuted })),
  toggleHaptics: () => set((prev) => ({ hapticsEnabled: !prev.hapticsEnabled })),
  resetGame: () =>
    set({
      roomCode: null,
      gameState: null,
      activeModal: null,
      selectedSpaceId: null,
      chatMessages: [],
      unreadChatCount: 0,
    }),
}));
