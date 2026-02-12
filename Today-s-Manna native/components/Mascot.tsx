import React from 'react';
import { View, TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';

interface MascotProps extends TouchableOpacityProps {
    onClick?: () => void;
}

const Mascot: React.FC<MascotProps> = ({ onClick, style, ...props }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClick}
            style={[styles.container, style]}
            {...props}
        >
            {/* Body */}
            <View style={styles.body}>
                {/* Eyes */}
                <View style={styles.eyesRow}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                </View>

                {/* Mouth */}
                <View style={styles.mouth} />

                {/* Cheeks */}
                <View style={[styles.cheek, styles.leftCheek]} />
                <View style={[styles.cheek, styles.rightCheek]} />
            </View>

            {/* Shine/Highlight */}
            <View style={styles.shine} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        itemsAlign: 'center',
        position: 'relative',
    },
    body: {
        width: 192,
        height: 160,
        backgroundColor: '#FFE082', // manna-yellow
        borderRadius: 48,
        borderWidth: 6,
        borderColor: '#8D6E63', // manna-brown
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    eyesRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 8,
    },
    eye: {
        width: 14,
        height: 14,
        backgroundColor: '#8D6E63',
        borderRadius: 7,
    },
    mouth: {
        width: 40,
        height: 20,
        borderBottomWidth: 6,
        borderColor: '#8D6E63',
        borderRadius: 20,
    },
    cheek: {
        position: 'absolute',
        width: 20,
        height: 12,
        backgroundColor: 'rgba(255, 205, 210, 1)', // red-200ish
        borderRadius: 6,
        top: 80,
    },
    leftCheek: {
        left: 24,
    },
    rightCheek: {
        right: 24,
    },
    shine: {
        position: 'absolute',
        top: 20,
        right: 40,
        width: 32,
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 8,
        transform: [{ rotate: '-12deg' }],
    }
});

export default Mascot;
