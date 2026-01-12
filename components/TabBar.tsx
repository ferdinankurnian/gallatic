import { useSelection } from '@/context/SelectionContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BookImage, EllipsisVertical, Images, Search, Share, Trash2 } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { isSelectionMode, selectedImages } = useSelection();
    const currentRoute = state.routes[state.index].name;
    const hasSelection = selectedImages.size > 0;

    return (
        <>
            <View style={styles.container}>
                {isSelectionMode ? (
                    <>
                        <View style={styles.leftSection}>
                            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <TouchableOpacity
                                style={[styles.tab, !hasSelection && styles.disabledTab]}
                                onPress={() => { }}
                                disabled={!hasSelection}
                            >
                                <Share size={24} color='white' />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, !hasSelection && styles.disabledTab]}
                                onPress={() => { }}
                                disabled={!hasSelection}
                            >
                                <Trash2 size={24} color='white' />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.rightSection}>
                            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <TouchableOpacity
                                style={[styles.searchButton, !hasSelection && styles.disabledTab]}
                                onPress={() => { }}
                                disabled={!hasSelection}
                            >
                                <EllipsisVertical size={24} color='white' />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.leftSection}>
                            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <TouchableOpacity
                                onPress={() => navigation.navigate('index')}
                                style={[styles.tab, currentRoute === 'index' && styles.activeTab]}
                            >
                                <Images
                                    size={24}
                                    color="white"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('album')}
                                style={[styles.tab, currentRoute === 'album' && styles.activeTab]}
                            >
                                <BookImage
                                    size={24}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.rightSection}>
                            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <TouchableOpacity
                                onPress={() => navigation.navigate('search')}
                                style={[styles.searchButton, currentRoute === 'search' && styles.activeSearch]}
                            >
                                <Search
                                    size={24}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
            <LinearGradient colors={['rgba(0,0,0,0)', '#000000']} style={styles.bottomNavBackground}></LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    bottomNavBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        width: '100%',
        zIndex: 1,
    },
    selectionSection: {
        flexDirection: 'row',
        borderColor: '#6d6d6d88',
        borderWidth: 2,
        borderRadius: 50,
        overflow: 'hidden',
        flex: 1,
        justifyContent: 'space-around',
    },
    actionButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        borderColor: '#6d6d6d88',
        borderWidth: 2,
        overflow: 'hidden',
        borderRadius: 50,
        padding: 5,
        gap: 2,
    },
    tab: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 28,
    },
    activeTab: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    rightSection: {
        borderColor: '#6d6d6d88',
        overflow: 'hidden',
        borderWidth: 2,
        borderRadius: 50,
    },
    searchButton: {
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    activeSearch: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    disabledTab: {
        opacity: 0.3,
    },
});