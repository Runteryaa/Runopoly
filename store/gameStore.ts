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
  boardSize: number;
  theme: string;
}

export const THEMES: Record<string, string[]> = {
  Classic: [
    "Mediterranean", "Baltic", "Reading", "Oriental", "Vermont", "Connecticut", "St. Charles", "Electric",
    "States", "Virginia", "Penn", "St. James", "Tennessee", "New York", "Kentucky", "Indiana", "Illinois",
    "B. & O.", "Atlantic", "Ventnor", "Water", "Marvin", "Pacific", "North Carolina", "Pennsylvania", "Short Line",
    "Park", "Boardwalk", "Luxury", "Tax"
  ],
  Istanbul: [
    "Kasımpaşa", "Dolapdere", "Sultanahmet", "Sirkeci", "Beyazıt", "Eminönü", "Karaköy", "Kabataş",
    "Beşiktaş", "Ortaköy", "Bebek", "Tarabya", "Sarıyer", "Üsküdar", "Kadıköy", "Moda", "Bostancı",
    "Maltepe", "Pendik", "Kartal", "Tuzla", "Şile", "Ağva", "Polonezköy", "Beykoz", "Çengelköy",
    "Kuzguncuk", "Acıbadem", "Bağdat Cad.", "Fenerbahçe", "Caddebostan", "Suadiye", "Erenköy", "Göztepe", "Nişantaşı", "Etiler"
  ],
  Köln: [
    "Kalk", "Mülheim", "Porz", "Deutz", "Südstadt", "Nippes", "Ehrenfeld", "Lindenthal", "Sülz",
    "Zollstock", "Rodenkirchen", "Chorweiler", "Longerich", "Weidenpesch", "Riehl", "Niehl",
    "Müngersdorf", "Braunsfeld", "Junkersdorf", "Weiden", "Lövenich", "Widdersdorf", "Bocklemünd",
    "Ossendorf", "Bickendorf", "Vogelsang", "Klettenberg", "Zündorf", "Wahn", "Urbach", "Grengel", "Eil", "Finkenberg", "Ensen"
  ],
  America: [
    "Bronx", "Brooklyn", "Queens", "Manhattan", "Staten Island", "Harlem", "Chelsea", "SoHo",
    "Tribeca", "Wall Street", "Broadway", "Times Square", "Central Park", "Hollywood", "Beverly Hills",
    "Santa Monica", "Venice", "Malibu", "Compton", "Downtown LA", "Silicon Valley", "Palo Alto",
    "San Francisco", "Golden Gate", "Las Vegas", "Miami Beach", "South Beach", "Chicago", "Boston", "Texas", "Dallas", "Houston", "Austin"
  ]
};

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
  activeTurnName: string;
  properties: Property[];
  cards: Card[];
  rules: GameRules;
  setPlayerName: (name: string) => void;
  setLobbyCode: (code: string) => void;
  setGamePlayers: (players: any[]) => void;
  setActiveTurnName: (name: string) => void;
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
  activeTurnName: '',
  rules: { goSalary: 200, jailFine: 50, startingMoney: 1500, maxDebt: 500, boardSize: 40, theme: 'Classic' },
  properties: Array.from({ length: 40 }).map((_, i) => {
    let name = THEMES.Classic[i % THEMES.Classic.length];
    let price = 100 + (i * 10);
    
    if (i === 0) { name = "GO"; price = 0; }
    else if (i === 10) { name = "JAIL"; price = 0; }
    else if (i === 20) { name = "PARKING"; price = 0; }
    else if (i === 30) { name = "GO TO JAIL"; price = 0; }
    
    return {
        id: `tile_${i}`,
        name,
        price,
        rent: price > 0 ? 10 + i : 0,
        color: ['#8b5cf6', '#3b82f6', '#ec4899', '#f97316', '#ef4444', '#eab308', '#10b981', '#1e3a8a'][Math.floor(i / (40 / 8)) % 8]
    };
  }),
  cards: [],
  setPlayerName: (name) => set({ playerName: name }),
  setLobbyCode: (code) => set({ lobbyCode: code }),
  setActiveTurnName: (name) => set({ activeTurnName: name }),
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
      p.id === id ? { ...p, position: absolute ? steps : (p.position + steps) % (state.rules.boardSize || 40) } : p
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
    gamePlayers: state.gamePlayers.map(p => p.id === id ? { ...p, inJail, position: inJail ? (state.rules.boardSize / 4) : p.position } : p)
  })),
  setProperty: (id, newProp) => set((state) => ({
    properties: state.properties.map(p => p.id === id ? { ...p, ...newProp } : p)
  })),
  setAllProperties: (properties) => set({ properties }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  setAllCards: (cards) => set({ cards }),
  setRules: (newRules) => set((state) => {
    const updatedRules = { ...state.rules, ...newRules };
    let newProperties = state.properties;
    
    if (newRules.boardSize || newRules.theme) {
        const theme = updatedRules.theme || state.rules.theme;
        const boardSize = updatedRules.boardSize || state.rules.boardSize;
        const themeNames = THEMES[theme] || THEMES.Classic;
        
        let nameIndex = 0;
        const s = boardSize / 4;
        newProperties = Array.from({ length: boardSize }).map((_, i) => {
            let name = "";
            let price = 100 + (i * 10);
            
            if (i === 0) { name = "GO"; price = 0; }
            else if (i === s) { name = "JAIL"; price = 0; }
            else if (i === s * 2) { name = "PARKING"; price = 0; }
            else if (i === s * 3) { name = "GO TO JAIL"; price = 0; }
            else {
                name = themeNames[nameIndex % themeNames.length];
                nameIndex++;
            }
            
            return {
                id: `tile_${i}`,
                name,
                price,
                rent: price > 0 ? 10 + i : 0,
                color: ['#8b5cf6', '#3b82f6', '#ec4899', '#f97316', '#ef4444', '#eab308', '#10b981', '#1e3a8a'][Math.floor(i / (boardSize / 8)) % 8]
            };
        });
    }
    return { rules: updatedRules, properties: newProperties };
  }),
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
