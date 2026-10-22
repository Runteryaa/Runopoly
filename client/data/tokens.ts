import { PlayerToken } from "../types/index.js";

export interface TokenMeta {
  id: PlayerToken;
  name: string;
  emoji: string;
  color: string;
  badgeBg: string;
}

export const TOKENS: TokenMeta[] = [
  { id: "top_hat", name: "Top Hat", emoji: "🎩", color: "#6366F1", badgeBg: "rgba(99, 102, 241, 0.2)" },
  { id: "scottie_dog", name: "Scottie Dog", emoji: "🐶", color: "#10B981", badgeBg: "rgba(16, 185, 129, 0.2)" },
  { id: "race_car", name: "Race Car", emoji: "🏎️", color: "#EF4444", badgeBg: "rgba(239, 68, 68, 0.2)" },
  { id: "battleship", name: "Battleship", emoji: "🚢", color: "#3B82F6", badgeBg: "rgba(59, 130, 246, 0.2)" },
  { id: "boot", name: "Boot", emoji: "🥾", color: "#F59E0B", badgeBg: "rgba(245, 158, 11, 0.2)" },
  { id: "thimble", name: "Thimble", emoji: "🧵", color: "#EC4899", badgeBg: "rgba(236, 72, 153, 0.2)" },
  { id: "iron", name: "Iron", emoji: "🪙", color: "#8B5CF6", badgeBg: "rgba(139, 92, 246, 0.2)" },
  { id: "wheelbarrow", name: "Wheelbarrow", emoji: "🛒", color: "#14B8A6", badgeBg: "rgba(20, 184, 166, 0.2)" },
];

export function getTokenMeta(token: PlayerToken): TokenMeta {
  return TOKENS.find((t) => t.id === token) || TOKENS[0]!;
}
