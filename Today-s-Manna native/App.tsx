import React, { useState, useEffect } from 'react';
import { View, StatusBar, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { useFonts, Jua_400Regular } from '@expo-google-fonts/jua';
import { NanumGothic_400Regular, NanumGothic_700Bold, NanumGothic_800ExtraBold } from '@expo-google-fonts/nanum-gothic';
import { GowunDodum_400Regular } from '@expo-google-fonts/gowun-dodum';
import { RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import StartScreen from './components/StartScreen';
import VerseScreen from './components/VerseScreen';
import DetailScreen from './components/DetailScreen';
import { INITIAL_DATA } from './constants/constants';
import { getDailyManna } from './services/mannaService';
import { ScreenState, MannaData } from './types/types';
import { fetchDailyManna } from './services/geminiService';

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
        let currentSound: Audio.Sound | undefined;
        async function loadSound() {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('./assets/bgm.wav'),
                    { isLooping: true, volume: 0.5 }
                );
                currentSound = sound;
                setSound(sound);
                await sound.playAsync();
            } catch (error) {
                console.log("Audio load error:", error);
            }
        }
        loadSound();

        return () => {
            currentSound?.unloadAsync();
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A5D6A7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#E0F7FA', '#B2EBF2', '#E0F7FA']}
                style={styles.gradient}
            >
                <View style={styles.screenContainer}>
                    {screen === ScreenState.START && (
                        <StartScreen onNext={handleNext} data={mannaData} isMuted={isMuted} toggleMute={toggleMute} />
                    )}
                    {screen === ScreenState.VERSE && (
                        <VerseScreen onNext={handleNext} data={mannaData} isMuted={isMuted} toggleMute={toggleMute} />
                    )}
                    {screen === ScreenState.DETAIL && (
                        <DetailScreen onNext={handleNext} onBack={handleBack} data={mannaData} isMuted={isMuted} toggleMute={toggleMute} />
                    )}

                    {/* Hidden Refresh Button */}
                    <View style={styles.refreshButtonContainer}>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            disabled={loading}
                            style={styles.refreshButton}
                        >
                            <RefreshCw size={24} color={loading ? "#888" : "#000"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    gradient: {
        flex: 1,
    },
    screenContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    refreshButtonContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 100,
        opacity: 0.1,
    },
    refreshButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
});
