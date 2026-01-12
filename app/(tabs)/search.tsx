import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SquareCheck, SquareCheckBig, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Search() {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const groupImagesIntoRows = (images: { id: string; uri: string }[]) => {
        const rows: { id: string; images: { id: string; uri: string }[] }[] = [];
        for (let i = 0; i < images.length; i += 4) {
            rows.push({
                id: `row-${i}`,
                images: images.slice(i, i + 4),
            });
        }
        return rows;
    };
    const sections = [
        {
            title: 'Today',
            count: 4,
            data: groupImagesIntoRows([
                { id: '1', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '2', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '3', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '4', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '5', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '6', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '7', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '8', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '9', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '10', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '11', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
                { id: '12', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
            ]),
        },
    ]
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: '#000',
            }}
        >
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={[styles.selectButton, styles.Button, { paddingHorizontal: isSelectionMode ? 13 : 10 }]}>
                {isSelectionMode && (
                    <TouchableOpacity style={styles.selectButtonContainer}>
                        <SquareCheck
                            size={24}
                            color="white"
                        />
                        <Text style={styles.selectButtonText}>Select All</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={isSelectionMode ? () => setIsSelectionMode(false) : () => setIsSelectionMode(true)}>
                    {isSelectionMode ? (
                        <X size={24} color="white" />
                    ) : (
                        <SquareCheckBig size={24} color="white" />
                    )}
                </TouchableOpacity>
            </BlurView>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                overScrollMode="never"
                stickySectionHeadersEnabled={true}
                renderSectionHeader={({ section }) => (
                    <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={styles.sectionHeader}>
                        {isSelectionMode && (
                            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
                                <TouchableOpacity style={styles.selectButtonContainer}>
                                    <SquareCheck
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            </BlurView>
                        )}
                        <View style={styles.sectionHeaderContent}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionCount}>{section.count} items</Text>
                        </View>
                    </LinearGradient>
                )
                }
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        {item.images.map((img) => (
                            <View key={img.id} style={styles.imageContainer}>
                                <Image source={{ uri: img.uri }} style={styles.image} />
                            </View>
                        ))}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    Button: {
        padding: 10,
        borderRadius: 50,
        overflow: 'hidden',
        borderColor: '#6d6d6d88',
        borderWidth: 2,
        display: 'flex',
        flexDirection: 'row',
        gap: 20,
    },
    selectButton: {
        position: 'absolute',
        top: 75,
        right: 20,
        zIndex: 1,
    },
    selectButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',

    },
    sectionHeaderContent: {
        display: 'flex',
        flexDirection: 'column',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
    },
    sectionCount: {
        color: '#ffffffb7',
        fontSize: 14,
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    imageContainer: {
        width: '25%',
        paddingHorizontal: 2,
        paddingVertical: 2,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
    },
});