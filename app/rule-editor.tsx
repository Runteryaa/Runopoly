import { CustomAlert } from '../utils/alert';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { useState } from 'react';
import { useTranslation } from '../utils/i18n';

export default function RuleEditor() {
  const router = useRouter();
  const { rules, setRules } = useGameStore();
  const { t } = useTranslation();
  
  const [goSalary, setGoSalary] = useState(rules.goSalary.toString());
  const [jailFine, setJailFine] = useState(rules.jailFine.toString());
  const [startingMoney, setStartingMoney] = useState(rules.startingMoney.toString());
  const [chanceCount, setChanceCount] = useState((rules.chanceCount ?? 3).toString());
  const [communityCount, setCommunityCount] = useState((rules.communityCount ?? 3).toString());
  const [taxCount, setTaxCount] = useState((rules.taxCount ?? 2).toString());

  const handleSave = () => {
    setRules({
        goSalary: parseInt(goSalary) || 200,
        jailFine: parseInt(jailFine) || 50,
        startingMoney: parseInt(startingMoney) || 1500,
        chanceCount: parseInt(chanceCount) || 0,
        communityCount: parseInt(communityCount) || 0,
        taxCount: parseInt(taxCount) || 0
    });
    CustomAlert.alert(t('saved'), t('rulesUpdatedSuccessfully'));
    router.back();
  };

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="px-6 pb-4 border-b border-zinc-800 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-black">{t('ruleEditor')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-4 py-2 rounded-lg">
          <Text className="text-zinc-400 font-bold">{t('back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">{t('startingMoney')}</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={startingMoney}
                onChangeText={setStartingMoney}
            />
            <Text className="text-zinc-500 text-xs mt-2">{t('amountMoneyStart')}</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">{t('passingGoSalary')}</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={goSalary}
                onChangeText={setGoSalary}
            />
            <Text className="text-zinc-500 text-xs mt-2">{t('moneyAwardedLap')}</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">{t('jailFine')}</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={jailFine}
                onChangeText={setJailFine}
            />
            <Text className="text-zinc-500 text-xs mt-2">{t('costToBribe')}</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">{t('theme')}</Text>
            <View className="flex-row gap-2 flex-wrap mt-2">
                {['Classic', 'Istanbul', 'Köln', 'America'].map(th => (
                    <TouchableOpacity 
                        key={th}
                        onPress={() => setRules({ theme: th })}
                        className={`px-4 py-2 rounded-lg border ${rules.theme === th ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-800 border-zinc-700'}`}
                    >
                        <Text className={`font-bold ${rules.theme === th ? 'text-white' : 'text-zinc-400'}`}>{th}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">{t('boardSize')}</Text>
            <View className="flex-row gap-2 flex-wrap mt-2">
                {[24, 32, 40].map(s => (
                    <TouchableOpacity 
                        key={s}
                        onPress={() => setRules({ boardSize: s })}
                        className={`px-4 py-2 rounded-lg border ${rules.boardSize === s ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-800 border-zinc-700'}`}
                    >
                        <Text className={`font-bold ${rules.boardSize === s ? 'text-white' : 'text-zinc-400'}`}>{s === 24 ? t('small') : s === 32 ? t('medium') : t('classic')}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text className="text-zinc-500 text-xs mt-2 mb-4">{t('changesNumTiles')}</Text>
            
            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2 text-[10px]">{t('chanceTiles')}</Text>
                    <TextInput
                        className="w-full bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 font-bold"
                        keyboardType="numeric"
                        value={chanceCount}
                        onChangeText={setChanceCount}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2 text-[10px]">{t('communityTiles')}</Text>
                    <TextInput
                        className="w-full bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 font-bold"
                        keyboardType="numeric"
                        value={communityCount}
                        onChangeText={setCommunityCount}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2 text-[10px]">{t('taxTiles')}</Text>
                    <TextInput
                        className="w-full bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 font-bold"
                        keyboardType="numeric"
                        value={taxCount}
                        onChangeText={setTaxCount}
                    />
                </View>
            </View>
            <Text className="text-zinc-500 text-xs mt-2">{t('specialTilesDesc')}</Text>
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-xl items-center shadow-lg shadow-emerald-500/30 mt-4 mb-10"
          onPress={handleSave}
        >
            <Text className="text-white font-bold text-lg">{t('saveRules')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

