import { View, Text, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../utils/socket';
import * as Updates from 'expo-updates';
import { CustomAlert } from '../utils/alert';
import Constants from 'expo-constants';
import SettingsModal from '../components/SettingsModal';
import { useTranslation } from '../utils/i18n';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { playerName, setPlayerName } = useGameStore();
  const [tempName, setTempName] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [serverInfo, setServerInfo] = useState<{ version: string, minBVersion?: number, latestAppVersion?: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
      const checkUpdateOnStart = async () => {
          if (__DEV__ || Platform.OS === 'web') return;
          try {
              const update = await Updates.checkForUpdateAsync();
              if (update.isAvailable) {
                  setIsUpdating(true);
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
              }
          } catch (e) {
              console.log('Update check failed on start', e);
          }
      };
      checkUpdateOnStart();

      socket.connect();
      socket.on('server_info', (info) => {
          setServerInfo(info);
      });

      return () => {
          socket.off('server_info');
      }
  }, []);

  const handleManualUpdateCheck = async () => {
      if (__DEV__) {
          CustomAlert.alert('Development', 'Updates are disabled in development mode.');
          return;
      }
      if (Platform.OS === 'web') {
          CustomAlert.alert(t('webVersion'), `v${serverInfo?.latestAppVersion || '1.0.0'}`);
          return;
      }
      try {
          setIsUpdating(true);
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
          } else {
              setIsUpdating(false);
              CustomAlert.alert(
                  t('upToDate'), 
                  `${t('upToDateDesc')}\n\nApp Version: v${serverInfo?.latestAppVersion || APP_VERSION}`
              );
          }
      } catch (e: any) {
          setIsUpdating(false);
          CustomAlert.alert(t('error'), `${e.message || String(e)}`);
      }
  };

  const appParts = APP_VERSION.split('.');
  const appB = parseInt(appParts[1] || '0', 10);
  const needsUpdate = Platform.OS !== 'web' && serverInfo?.minBVersion !== undefined && appB < serverInfo.minBVersion;

  if (needsUpdate) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900 p-6">
        <View className="items-center mb-8">
          <Text className="text-6xl mb-4">⚠️</Text>
          <Text className="text-3xl font-black text-white text-center">{t('updateRequired')}</Text>
          <Text className="text-zinc-400 mt-4 text-center text-lg">
            {t('updateRequiredDesc').replace('{{version}}', APP_VERSION)}
          </Text>
        </View>
      </View>
    );
  }

  if (isUpdating) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900 p-6">
        <View className="items-center mb-8">
          <Text className="text-6xl mb-4 animate-bounce">📦</Text>
          <Text className="text-3xl font-black text-white text-center">{t('updating')}</Text>
          <Text className="text-zinc-400 mt-4 text-center text-lg">
            {t('updatingDesc')}
          </Text>
        </View>
      </View>
    );
  }


  if (!playerName) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900 p-6">
        <View className="absolute top-12 right-6 gap-2">
            <TouchableOpacity 
                className="bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700 items-end"
                onPress={handleManualUpdateCheck}
            >
                <Text className="text-zinc-400 font-bold text-xs uppercase">App: v{Platform.OS === 'web' && serverInfo?.latestAppVersion ? serverInfo.latestAppVersion : APP_VERSION}</Text>
                <Text className="text-zinc-500 font-bold text-xs uppercase">Server: v{serverInfo?.version || '...'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 items-center justify-center self-end"
                onPress={() => setSettingsVisible(true)}
            >
                <Text style={{ fontSize: 24 }} allowFontScaling={false}>⚙️</Text>
            </TouchableOpacity>
        </View>

        <View className="items-center mb-12">
          <Text className="text-5xl font-black text-white tracking-tighter">
            RUN<Text className="text-emerald-500">OPOLY</Text>
          </Text>
          <Text className="text-zinc-400 mt-2 text-lg font-medium">{t('welcome')}</Text>
        </View>
        <View className="w-full max-w-sm space-y-4">
          <Text className="text-zinc-400 font-bold uppercase tracking-widest ml-1 mb-2">{t('chooseUsername')}</Text>
          <TextInput 
            className="w-full bg-zinc-800 text-white p-5 rounded-2xl border border-zinc-700 font-bold text-lg mb-4"
            placeholder={t('placeholderUsername')}
            placeholderTextColor="#52525b"
            value={tempName}
            onChangeText={setTempName}
          />
          <TouchableOpacity 
            className="w-full bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30"
            onPress={() => tempName.trim() && setPlayerName(tempName.trim())}
          >
            <Text className="text-white font-bold text-lg">{t('continue')}</Text>
          </TouchableOpacity>
        </View>
        <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-900 p-6">
      <View className="absolute top-12 right-6 gap-2">
          <TouchableOpacity 
              className="bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700 items-end"
              onPress={handleManualUpdateCheck}
          >
              <Text className="text-zinc-400 font-bold text-xs uppercase">App: v{Platform.OS === 'web' && serverInfo?.latestAppVersion ? serverInfo.latestAppVersion : APP_VERSION}</Text>
              <Text className="text-zinc-500 font-bold text-xs uppercase">Server: v{serverInfo?.version || '...'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 items-center justify-center self-end"
              onPress={() => setSettingsVisible(true)}
          >
              <Text style={{ fontSize: 24 }} allowFontScaling={false}>⚙️</Text>
          </TouchableOpacity>
      </View>
      
      <View className="items-center mb-12">
        <Text className="text-5xl font-black text-white tracking-tighter">
          RUN<Text className="text-emerald-500">OPOLY</Text>
        </Text>
        <Text className="text-zinc-400 mt-2 text-lg font-medium">{t('welcomeBack')}<Text className="text-emerald-400">{playerName}</Text></Text>
      </View>

      <View className="w-full max-w-sm space-y-4 gap-4">
        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30"
          onPress={() => router.push({ pathname: '/lobby', params: { isHost: 'true' } })}
        >
          <Text className="text-white font-bold text-lg">{t('createLobby')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 py-4 rounded-2xl items-center"
          onPress={() => router.push('/join')}
        >
          <Text className="text-white font-bold text-lg">{t('joinGame')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 py-4 rounded-2xl items-center"
          onPress={() => router.push('/editors')}
        >
          <Text className="text-zinc-300 font-bold text-lg">{t('gameEditors')}</Text>
        </TouchableOpacity>
      </View>
      
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}
