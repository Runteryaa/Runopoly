import { create } from 'zustand';

export interface Property {
  id: string;
  name: string;
  price: number;
  rent: number;
  color: string;
  ownerId?: string | null;
  houses?: number;
  hotels?: number;
}

export interface Card {
  id: string;
  type: 'chance' | 'community';
  text: string;
  action: 'pay' | 'receive' | 'move';
  amount?: number;
}

export interface GameRules {
  goSalary: number;
  jailFine: number;
  startingMoney: number;
  maxDebt: number;
}

export interface TradeData {
  id: string;
  fromId: string;
  toId: string;
  offerMoney: number;
  requestMoney: number;
  offerProperties: string[];
  requestProperties: string[];
}

interface GameState {
  playerName: string;
  lobbyCode: string;
  gamePlayers: any[];
  activeTurnId: string;
  properties: Property[];
  cards: Card[];
  rules: GameRules;
  setPlayerName: (name: string) => void;
  setLobbyCode: (code: string) => void;
  setGamePlayers: (players: any[]) => void;
  setActiveTurnId: (id: string) => void;
  updatePlayerPosition: (id: string, steps: number, absolute?: boolean) => void;
  buyProperty: (propertyId: string, ownerId: string, price: number) => void;
  payRent: (fromId: string, toId: string, amount: number) => void;
  passedGo: (id: string) => void;
  executeCard: (id: string, card: Card) => void;
  setJailStatus: (id: string, inJail: boolean) => void;
  setProperty: (id: string, property: Partial<Property>) => void;
  setAllProperties: (properties: Property[]) => void;
  addCard: (card: Card) => void;
  setAllCards: (cards: Card[]) => void;
  setRules: (rules: Partial<GameRules>) => void;
  executeTrade: (trade: TradeData) => void;
  upgradeProperty: (propertyId: string, houses: number, hotels: number, cost: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerName: '',
  lobbyCode: '',
  gamePlayers: [],
  activeTurnId: '',
  rules: { goSalary: 200, jailFine: 50, startingMoney: 1500, maxDebt: 500 },
  properties: Array.from({ length: 40 }).map((_, i) => ({
    id: `tile_${i}`,
    name: `Property ${i}`,
    price: 100 + (i * 10),
    rent: 10 + i,
    color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 5]
  })),
  cards: [],
  setPlayerName: (name) => set({ playerName: name }),
  setLobbyCode: (code) => set({ lobbyCode: code }),
  setActiveTurnId: (id) => set({ activeTurnId: id }),
  setGamePlayers: (players) => set((state) => ({ 
    gamePlayers: players.map((p, i) => ({ 
      ...p, 
      position: 0, 
      money: state.rules.startingMoney, 
      inJail: false,
      color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][i % 4] 
    })) 
  })),
  updatePlayerPosition: (id, steps, absolute = false) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => 
      p.id === id ? { ...p, position: absolute ? steps : (p.position + steps) % 40 } : p
    )
  })),
  buyProperty: (propertyId, ownerId, price) => set((state) => ({
    properties: state.properties.map(p => p.id === propertyId ? { ...p, ownerId } : p),
    gamePlayers: state.gamePlayers.map(p => p.id === ownerId ? { ...p, money: p.money - price } : p)
  })),
  payRent: (fromId, toId, amount) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => {
      if (p.id === fromId) return { ...p, money: p.money - amount };
      if (p.id === toId) return { ...p, money: p.money + amount };
      return p;
    })
  })),
  passedGo: (id) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => p.id === id ? { ...p, money: p.money + state.rules.goSalary } : p)
  })),
  executeCard: (id, card) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => {
      if (p.id !== id) return p;
      if (card.action === 'pay') return { ...p, money: p.money - (card.amount || 0) };
      if (card.action === 'receive') return { ...p, money: p.money + (card.amount || 0) };
      return p;
    })
  })),
  setJailStatus: (id, inJail) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => p.id === id ? { ...p, inJail, position: inJail ? 10 : p.position } : p)
  })),
  setProperty: (id, newProp) => set((state) => ({
    properties: state.properties.map(p => p.id === id ? { ...p, ...newProp } : p)
  })),
  setAllProperties: (properties) => set({ properties }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  setAllCards: (cards) => set({ cards }),
  setRules: (newRules) => set((state) => ({ rules: { ...state.rules, ...newRules } })),
  executeTrade: (trade) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => {
        if (p.id === trade.fromId) return { ...p, money: p.money - trade.offerMoney + trade.requestMoney };
        if (p.id === trade.toId) return { ...p, money: p.money - trade.requestMoney + trade.offerMoney };
        return p;
    }),
    properties: state.properties.map(p => {
        if (trade.offerProperties.includes(p.id)) return { ...p, ownerId: trade.toId };
        if (trade.requestProperties.includes(p.id)) return { ...p, ownerId: trade.fromId };
        return p;
    })
  })),
  upgradeProperty: (propertyId, houses, hotels, cost) => set((state) => {
    const prop = state.properties.find(p => p.id === propertyId);
    if (!prop || !prop.ownerId) return state;
    return {
        properties: state.properties.map(p => p.id === propertyId ? { ...p, houses, hotels } : p),
        gamePlayers: state.gamePlayers.map(p => p.id === prop.ownerId ? { ...p, money: p.money - cost } : p)
    };
  })
}));
