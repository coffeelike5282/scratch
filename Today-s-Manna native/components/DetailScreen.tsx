import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ScreenProps } from '../types/types';
import { Croissant, Sparkles, ClipboardCheck, Volume2, VolumeX } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const DetailScreen: React.FC<ScreenProps> = ({ onBack, data, isMuted, toggleMute }) => {
    return (
        <View style={styles.container}>
            {/* Header / Background Overlay */}
            <View style={styles.backgroundOverlay}>
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.headerIconBox}>
                                <Croissant color="#A5D6A7" size={24} />
                            </View>
                            <Text style={styles.headerTitle}>오늘의 만나</Text>
                        </View>
                        <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                            {isMuted ? <VolumeX color="gray" size={20} /> : <Volume2 color="#5D4037" size={20} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Content Sheet */}
            <View style={styles.sheet}>
                {/* Drag Handle simulation */}
                <TouchableOpacity style={styles.dragHandleContainer} onPress={onBack}>
                    <View style={styles.dragHandle} />
                </TouchableOpacity>

                <View style={styles.sheetContent}>
                    {/* Interpretation Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Sparkles color="#8D6E63" size={20} />
                            <Text style={styles.sectionTitle}>오늘의 해석</Text>
                        </View>
                        <View style={styles.interpretationBox}>
                            <ScrollView showsVerticalScrollIndicator={true}>
                                <Text style={styles.interpretationText}>
                                    {data.interpretation}
                                </Text>
                            </ScrollView>
                        </View>
                    </View>

                    {/* Mission Section */}
                    <View style={styles.missionSection}>
                        <View style={styles.sectionHeader}>
                            <ClipboardCheck color="#8D6E63" size={20} />
                            <Text style={styles.sectionTitle}>오늘의 미션</Text>
                        </View>
                        <View style={styles.missionCard}>
                            <Text style={styles.missionText}>
                                {data.mission}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Complete Button */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={onBack} style={styles.completeButton}>
                        <Text style={styles.completeButtonText}>미션 완료!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    backgroundOverlay: {
        height: height * 0.2,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconBox: {
        width: 44,
        height: 44,
        backgroundColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: 'Jua_400Regular',
        color: '#333',
    },
    muteButton: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    sheet: {
        flex: 1,
        backgroundColor: '#FFF9C4', // manna-yellow tint
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        marginTop: -30,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderTopWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    dragHandleContainer: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 10,
    },
    dragHandle: {
        width: 48,
        height: 6,
        backgroundColor: 'rgba(141, 110, 99, 0.2)',
        borderRadius: 3,
    },
    sheetContent: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 10,
    },
    section: {
        height: '45%',
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'Jua_400Regular',
        color: '#8D6E63',
    },
    interpretationBox: {
        flex: 1,
        backgroundColor: '#E0F2F1', // interpretation-mint
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    interpretationText: {
        fontSize: 18,
        lineHeight: 28,
        color: '#444',
        fontFamily: 'GowunDodum_400Regular',
    },
    missionSection: {
        flex: 1,
        marginBottom: 20,
    },
    missionCard: {
        flex: 1,
        backgroundColor: '#FFF0F3', // mission-pink
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(141, 110, 99, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    missionText: {
        fontSize: 24,
        textAlign: 'center',
        color: '#689F38',
        fontFamily: 'NanumGothic_800ExtraBold',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 10,
    },
    completeButton: {
        width: '100%',
        height: 64,
        backgroundColor: '#FF5252',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    completeButtonText: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'Jua_400Regular',
    },
});

export default DetailScreen;
