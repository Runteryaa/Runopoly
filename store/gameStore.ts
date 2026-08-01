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
  isMortgaged?: boolean;
  mortgageTurns?: number;
  housePrice?: number;
}

export interface Card {
  id: string;
  type: 'chance' | 'community';
  text: string;
  action: 'pay' | 'receive' | 'move' | 'show';
  amount?: number;
  behavior?: 'instant' | 'keepable';
}

export const AVAILABLE_CHARACTERS = ['🚗', '🐕', '🎩', '🚢', '👞', '🛒'];

export interface GameRules {
  goSalary: number;
  jailFine: number;
  startingMoney: number;
  boardSize: number;
  theme: string;
  incomeTax: number;
  speedDie: boolean;
  chanceCount: number;
  communityCount: number;
  taxCount: number;
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
  toggleMortgage: (propertyId: string, isMortgaged: boolean, cost: number) => void;
  incrementMortgageTurns: (playerName: string) => void;
  updatePlayerStats: (id: string, updates: any) => void;
  addCardToInventory: (playerId: string, card: Card) => void;
  removeCardFromInventory: (playerId: string, cardId: string) => void;
  resolveBankruptcy: (playerId: string) => void;
}

function generateBoard(rules: GameRules): Property[] {
    const themeNames = THEMES[rules.theme] || THEMES.Classic;
    const boardSize = rules.boardSize;
    let genProps: Property[] = new Array(boardSize).fill(null);
    const s = boardSize / 4;
    
    // Corners
    genProps[0] = { id: 'tile_0', name: "GO", price: 0, rent: 0, color: 'gray' };
    genProps[s] = { id: `tile_${s}`, name: "JAIL", price: 0, rent: 0, color: 'gray' };
    genProps[s * 2] = { id: `tile_${s * 2}`, name: "PARKING", price: 0, rent: 0, color: 'gray' };
    genProps[s * 3] = { id: `tile_${s * 3}`, name: "GO TO JAIL", price: 0, rent: 0, color: 'gray' };

    let availableIndices: number[] = [];
    for (let i = 1; i < boardSize; i++) {
        if (i !== s && i !== s * 2 && i !== s * 3) {
            availableIndices.push(i);
        }
    }

    const placeItems = (count: number, name: string, price: number = 0, color: string = 'gray') => {
        if (count <= 0 || availableIndices.length === 0) return;
        const step = availableIndices.length / count;
        let toRemove: number[] = [];
        for (let i = 0; i < count; i++) {
            if (availableIndices.length === 0) break;
            const idx = Math.floor(i * step + step / 2);
            toRemove.push(availableIndices[idx]);
        }
        toRemove.forEach(r => {
            genProps[r] = { id: `tile_${r}`, name, price, rent: 0, color };
            availableIndices = availableIndices.filter(a => a !== r);
        });
    };

    placeItems(rules.chanceCount, "CHANCE");
    placeItems(rules.communityCount, "COMMUNITY CHEST");
    placeItems(rules.taxCount, "TAX");
    placeItems(Math.max(1, Math.floor(boardSize / 10)), "STATION", 200, '#475569');
    placeItems(Math.max(1, Math.floor(boardSize / 20)), "UTILITY", 150, '#94a3b8');

    const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#f97316', '#ef4444', '#eab308', '#10b981', '#1e3a8a'];
    let nameIndex = 0;
    
    const propsPerColor = Math.max(1, Math.floor(availableIndices.length / 8));
    
    availableIndices.forEach((r, idx) => {
        const price = 100 + (r * 10);
        let housePrice = 50;
        if (r > s && r < s * 2) housePrice = 100;
        else if (r > s * 2 && r < s * 3) housePrice = 150;
        else if (r > s * 3) housePrice = 200;

        genProps[r] = {
            id: `tile_${r}`,
            name: themeNames[nameIndex % themeNames.length],
            price,
            rent: price > 0 ? 10 + r : 0,
            color: colors[Math.min(7, Math.floor(idx / propsPerColor))],
            housePrice,
            isMortgaged: false
        };
        nameIndex++;
    });

    return genProps;
}

const initialRules: GameRules = { goSalary: 200, jailFine: 50, startingMoney: 1500, boardSize: 40, theme: 'Classic', incomeTax: 200, speedDie: false, chanceCount: 3, communityCount: 3, taxCount: 2 };

const defaultCards: Card[] = [
    // Chance Cards
    { id: 'chance_1', type: 'chance', text: 'Advance to GO. Collect $200.', action: 'receive', amount: 200, behavior: 'instant' },
    { id: 'chance_2', type: 'chance', text: 'Bank pays you dividend of $50.', action: 'receive', amount: 50, behavior: 'instant' },
    { id: 'chance_3', type: 'chance', text: 'Go directly to Jail. Do not pass GO, do not collect $200.', action: 'pay', amount: 0, behavior: 'instant' }, // Usually this would move you, but we just make it an instant text card for now, or just fine you. Let's stick to simple pay/receive for default actions since we don't have a "move" action implemented on the backend yet. We can just say "Pay a $50 fine for speeding."
    { id: 'chance_4', type: 'chance', text: 'Pay poor tax of $15.', action: 'pay', amount: 15, behavior: 'instant' },
    { id: 'chance_5', type: 'chance', text: 'Get out of Jail Free. This card may be kept until needed.', action: 'show', amount: 0, behavior: 'keepable' },
    { id: 'chance_6', type: 'chance', text: 'You have been elected Chairman of the Board. Pay each player $50.', action: 'pay', amount: 50, behavior: 'instant' }, // Note: Our simple action system deducts 50 from the player.
    { id: 'chance_7', type: 'chance', text: 'Your building loan matures. Collect $150.', action: 'receive', amount: 150, behavior: 'instant' },

    // Community Chest Cards
    { id: 'comm_1', type: 'community', text: 'Advance to GO. Collect $200.', action: 'receive', amount: 200, behavior: 'instant' },
    { id: 'comm_2', type: 'community', text: 'Bank error in your favor. Collect $200.', action: 'receive', amount: 200, behavior: 'instant' },
    { id: 'comm_3', type: 'community', text: 'Doctor\'s fee. Pay $50.', action: 'pay', amount: 50, behavior: 'instant' },
    { id: 'comm_4', type: 'community', text: 'Get out of Jail Free. This card may be kept until needed.', action: 'show', amount: 0, behavior: 'keepable' },
    { id: 'comm_5', type: 'community', text: 'Income tax refund. Collect $20.', action: 'receive', amount: 20, behavior: 'instant' },
    { id: 'comm_6', type: 'community', text: 'Life insurance matures. Collect $100.', action: 'receive', amount: 100, behavior: 'instant' },
    { id: 'comm_7', type: 'community', text: 'Pay hospital fees of $100.', action: 'pay', amount: 100, behavior: 'instant' },
    { id: 'comm_8', type: 'community', text: 'You have won second prize in a beauty contest. Collect $10.', action: 'receive', amount: 10, behavior: 'instant' },
    { id: 'comm_9', type: 'community', text: 'You inherit $100.', action: 'receive', amount: 100, behavior: 'instant' }
];

export const useGameStore = create<GameState>((set) => ({
  playerName: '',
  lobbyCode: '',
  gamePlayers: [],
  activeTurnName: '',
  rules: initialRules,
  properties: generateBoard(initialRules),
  cards: defaultCards,
  setPlayerName: (name) => set({ playerName: name }),
  setLobbyCode: (code) => set({ lobbyCode: code }),
  setActiveTurnName: (name) => set({ activeTurnName: name }),
  setGamePlayers: (players) => set((state) => ({ 
    gamePlayers: players.map((p, i) => ({ 
      ...p, 
      position: 0, 
      money: state.rules.startingMoney, 
      inJail: false,
      jailTurns: 0,
      doublesCount: 0,
      inventoryCards: [],
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
      if (p.id === fromId) {
          const newMoney = p.money - amount;
          return { ...p, money: newMoney, bankruptCreditorId: newMoney < 0 ? toId : undefined, bankruptAmount: newMoney < 0 ? Math.abs(newMoney) : undefined };
      }
      if (p.id === toId) return { ...p, money: p.money + amount };
      return p;
    })
  })),
  passedGo: (id) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => p.id === id ? { ...p, money: p.money + state.rules.goSalary } : p)
  })),
  executeCard: (id, card) => set((state) => {
    if (card.action === 'show') {
       return state;
    }
    return {
        gamePlayers: state.gamePlayers.map(p => {
          if (p.id !== id) return p;
          if (card.action === 'pay') {
              const newMoney = p.money - (card.amount || 0);
              return { ...p, money: newMoney, bankruptCreditorId: newMoney < 0 ? 'BANK' : undefined, bankruptAmount: newMoney < 0 ? Math.abs(newMoney) : undefined };
          }
          if (card.action === 'receive') return { ...p, money: p.money + (card.amount || 0) };
          return p;
        })
      };
  }),
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
    
    if (newRules.boardSize !== undefined || newRules.theme !== undefined || newRules.chanceCount !== undefined || newRules.communityCount !== undefined || newRules.taxCount !== undefined) {
        newProperties = generateBoard(updatedRules);
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
  }),
  toggleMortgage: (propertyId, isMortgaged, cost) => set((state) => {
    const prop = state.properties.find(p => p.id === propertyId);
    if (!prop || !prop.ownerId) return state;
    return {
        properties: state.properties.map(p => p.id === propertyId ? { ...p, isMortgaged, mortgageTurns: isMortgaged ? 0 : undefined } : p),
        gamePlayers: state.gamePlayers.map(p => p.id === prop.ownerId ? { ...p, money: p.money + cost } : p)
    };
  }),
  incrementMortgageTurns: (playerName) => set((state) => {
    const player = state.gamePlayers.find(p => p.name === playerName);
    if (!player) return state;
    return {
        properties: state.properties.map(p => 
            (p.ownerId === player.id && p.isMortgaged) 
                ? { ...p, mortgageTurns: (p.mortgageTurns || 0) + 1 } 
                : p
        )
    };
  }),
  updatePlayerStats: (id, updates) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  addCardToInventory: (playerId, card) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => 
      p.id === playerId ? { ...p, inventoryCards: [...(p.inventoryCards || []), card] } : p
    )
  })),
  removeCardFromInventory: (playerId, cardId) => set((state) => ({
    gamePlayers: state.gamePlayers.map(p => 
      p.id === playerId ? { ...p, inventoryCards: (p.inventoryCards || []).filter((c: Card) => c.id !== cardId) } : p
    )
  })),
  resolveBankruptcy: (playerId) => set((state) => {
      const bankruptPlayer = state.gamePlayers.find(p => p.id === playerId);
      if (!bankruptPlayer) return state;

      let creditorId = bankruptPlayer.bankruptCreditorId;
      let debtAmount = bankruptPlayer.bankruptAmount || 0;
      
      if (bankruptPlayer.debts && bankruptPlayer.debts.length > 0) {
          creditorId = bankruptPlayer.debts[0].to;
          debtAmount = bankruptPlayer.debts[0].amount;
      }

      let currentDebt = debtAmount;
      const updatedProperties = state.properties.map(p => {
          if (p.ownerId !== playerId) return p; 
          
          if (creditorId && creditorId !== 'BANK' && currentDebt > 0) {
              const value = p.price; 
              currentDebt -= value;
              return { ...p, ownerId: creditorId, houses: 0, hotels: 0, isMortgaged: false, mortgageTurns: undefined };
          }
          return { ...p, ownerId: null, houses: 0, hotels: 0, isMortgaged: false, mortgageTurns: undefined };
      });
      
      return { properties: updatedProperties };
  })
}));
