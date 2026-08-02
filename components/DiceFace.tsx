import React from 'react';
import { View, StyleSheet } from 'react-native';

type DiceFaceProps = {
    value: number;
    size?: number;
    color?: string;
    dotColor?: string;
};

const PIP_POSITIONS: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

export default function DiceFace({
    value,
    size = 48,
    color = '#ffffff',
    dotColor = '#111111',
}: DiceFaceProps) {
    const pips = PIP_POSITIONS[value] || PIP_POSITIONS[1];
    const cell = size / 3;
    const dotSize = Math.max(4, Math.floor(cell * 0.42));

    return (
        <View
            style={[
                styles.face,
                {
                    width: size,
                    height: size,
                    backgroundColor: color,
                    borderRadius: Math.floor(size * 0.18),
                },
            ]}
        >
            {pips.map(([row, col], i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: dotColor,
                        left: col * cell + (cell - dotSize) / 2,
                        top: row * cell + (cell - dotSize) / 2,
                    }}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    face: {
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
});
