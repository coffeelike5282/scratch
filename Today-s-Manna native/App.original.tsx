import React, { useState, useEffect } from 'react';
import { View, ImageBackground, StatusBar, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { useFonts, Jua_400Regular } from '@expo-google-fonts/jua';
import { NanumGothic_400Regular, NanumGothic_700Bold, NanumGothic_800ExtraBold } from '@expo-google-fonts/nanum-gothic';
import { GowunDodum_400Regular } from '@expo-google-fonts/gowun-dodum';
import { RefreshCw } from 'lucide-react-native';

import StartScreen from './components/StartScreen';
import VerseScreen from './components/VerseScreen';
import DetailScreen from './components/DetailScreen';
import { INITIAL_DATA } from './constants/constants';
import { getDailyManna } from './services/mannaService';
import { ScreenState, MannaData } from './types/types';
import { fetchDailyManna } from './services/geminiService';

// To use NativeWind, verify "className" works. If not, import "./global.css" (create it) or similar.

export default function App() {
  const [screen, setScreen] = useState<ScreenState>(ScreenState.START);
  const [mannaData, setMannaData] = useState<MannaData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound>();
  const [isMuted, setIsMuted] = useState(false);

  const [fontsLoaded] = useFonts({
    Jua_400Regular,
    NanumGothic_400Regular,
    NanumGothic_700Bold,
    NanumGothic_800ExtraBold,
    GowunDodum_400Regular,
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await getDailyManna();
      if (data) setMannaData(data);
    };
    loadData();
  }, []);

  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('./assets/bgm.wav'),
          { isLooping: true, volume: 0.5 }
        );
        setSound(sound);
        // Autoplay might be restricted, but we can try
        await sound.playAsync();
      } catch (error) {
        console.log("Audio load error:", error);
      }
    }
    loadSound();

    return () => {
      sound?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    async function updateMute() {
      if (sound) {
        await sound.setIsMutedAsync(isMuted);
      }
    }
    updateMute();
  }, [isMuted, sound]);

  const attemptPlay = async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      // @ts-ignore
      if (status.isLoaded && !status.isPlaying) {
        await sound.playAsync();
      }
    }
  };

  const handleNext = () => {
    attemptPlay();
    if (screen === ScreenState.START) setScreen(ScreenState.VERSE);
    else if (screen === ScreenState.VERSE) setScreen(ScreenState.DETAIL);
  };

  const handleBack = () => {
    if (screen === ScreenState.DETAIL) setScreen(ScreenState.VERSE);
    else setScreen(ScreenState.START);
  };

  const handleRefresh = async () => {
    setLoading(true);
    const newData = await fetchDailyManna();
    if (newData) {
      setMannaData(newData);
    }
    setLoading(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    attemptPlay();
  };

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#A5D6A7" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      {/* Container simulating the mobile frame from web, but taking full screen in native */}
      <View className="flex-1 w-full h-full bg-[#E0F7FA]">
        {/* Background Gradient Simulation - usually requires LinearGradient. 
            For now using a simple View with background color or we can use expo-linear-gradient if installed.
            We installed expo-linear-gradient.
        */}
        {/* NativeWind LinearGradient support is sometimes tricky. Use standard LinearGradient component if possible or just style */}

        <View className="flex-1 w-full h-full bg-[#E0F7FA] overflow-hidden">

          {/* Screens */}
          {screen === ScreenState.START && (
            <StartScreen onNext={handleNext} data={mannaData} isMuted={isMuted} toggleMute={toggleMute} />
          )}
          {screen === ScreenState.VERSE && (
            <VerseScreen onNext={handleNext} data={mannaData} isMuted={isMuted} toggleMute={toggleMute} />
          )}
          {screen === ScreenState.DETAIL && (
            <DetailScreen onNext={handleNext} onBack={handleBack} data={mannaData} isMuted={isMuted} toggleMute={toggleMute} />
          )}

          {/* Hidden Debug/Refresh feature */}
          <View className="absolute top-12 left-6 z-50 opacity-10">
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={loading}
              className="p-2 bg-white/50 rounded-full"
            >
              <RefreshCw size={24} color={loading ? "#888" : "#000"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
