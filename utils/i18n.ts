import { useSettingsStore } from '../store/settingsStore';

export const translations = {
  en: {
    // index.tsx
    updateRequired: "Update Required",
    updateRequiredDesc: "This update includes major core features. Your app version is too old. Please download the latest version to continue playing.",
    updating: "Downloading Update...",
    updatingDesc: "Please wait, the game is being updated and will restart.",
    welcome: "Welcome to the game!",
    chooseUsername: "Choose a Username",
    placeholderUsername: "e.g. Runterya",
    continue: "Continue",
    welcomeBack: "Welcome back, ",
    createLobby: "Create Lobby",
    joinGame: "Join Game",
    gameEditors: "Game Editors",
    settings: "Settings",

    // Settings Modal
    language: "Language",
    close: "Close",
    
    // Global / Alerts
    error: "Error",
    upToDate: "Up to Date",
    upToDateDesc: "You are already on the latest version.",
    webVersion: "Web Version",

    // game.tsx
    rollDice: "ROLL DICE",
    endTurn: "END TURN",
    forceEndTurn: "Force End Turn",
    waitingFor: "Waiting for ",
    payDebt: "PAY DEBT",
    bankrupt: "BANKRUPT",
    mortgage: "MORTGAGE",
    borrow: "BORROW",
    payRent: "PAY RENT",
    raiseFunds: "Raise Funds",
    
    // lobby.tsx
    lobbyCode: "Lobby Code",
    players: "Players",
    startGame: "Start Game",
    waitingToStart: "Waiting for host to start...",
    leaveLobby: "Leave Lobby",
  },
  tr: {
    // index.tsx
    updateRequired: "Güncelleme Gerekli",
    updateRequiredDesc: "Bu güncelleme temel özellikleri içeriyor. Sürümünüz çok eski. Lütfen devam etmek için en güncel sürümü indirin.",
    updating: "Güncelleme İndiriliyor...",
    updatingDesc: "Lütfen bekleyin, oyun güncelleniyor ve baştan başlatılacak.",
    welcome: "Oyuna Hoş Geldin!",
    chooseUsername: "Kullanıcı Adı Seç",
    placeholderUsername: "Örn: Runterya",
    continue: "Devam Et",
    welcomeBack: "Tekrar Hoş Geldin, ",
    createLobby: "Lobi Kur",
    joinGame: "Oyuna Katıl",
    gameEditors: "Oyun Editörleri",
    settings: "Ayarlar",

    // Settings Modal
    language: "Dil",
    close: "Kapat",
    
    // Global / Alerts
    error: "Hata",
    upToDate: "Güncel",
    upToDateDesc: "Zaten en güncel sürümdesiniz.",
    webVersion: "Web Sürümü",

    // game.tsx
    rollDice: "ZAR AT",
    endTurn: "TURU BİTİR",
    forceEndTurn: "Turu Zorla Bitir",
    waitingFor: "Bekleniyor: ",
    payDebt: "BORCUNU ÖDE",
    bankrupt: "İFLAS",
    mortgage: "İPOTEK",
    borrow: "BORÇ AL",
    payRent: "KİRA ÖDE",
    raiseFunds: "Para Bul",

    // lobby.tsx
    lobbyCode: "Lobi Kodu",
    players: "Oyuncular",
    startGame: "Oyunu Başlat",
    waitingToStart: "Kurucunun başlatması bekleniyor...",
    leaveLobby: "Lobiden Ayrıl",
  }
};

export function useTranslation() {
    const language = useSettingsStore(state => state.language);
    
    const t = (key: keyof typeof translations['en']) => {
        return translations[language][key] || key;
    };

    return { t, language };
}
