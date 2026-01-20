import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { mediaLibraryScanner, Album } from '@/services/mediaLibraryScanner';

export default function AlbumScreen() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAlbums = async () => {
      setIsLoading(true);
      try {
        await mediaLibraryScanner.requestPermission();
        // Use optimized buildAlbums instead of scanning everything
        const albumData = await mediaLibraryScanner.buildAlbums();
        setAlbums(albumData);
      } catch (error) {
        console.error('Error loading albums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbums();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading albums...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <FlashList
        data={albums}
        keyExtractor={(item) => item.id}
        estimatedItemSize={280}
        onRefresh={async () => {
          const albumData = await mediaLibraryScanner.buildAlbums();
          setAlbums(albumData);
        }}
        refreshing={false}
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Albums</Text>
              <Text style={styles.sectionCount}>{albums.length} albums</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.albumCard}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <ExpoImage 
                source={{ uri: item.coverImage }} 
                style={styles.coverImage}
                contentFit="cover"
                cachePolicy="disk"
              />
              <LinearGradient 
                colors={['transparent', 'rgba(0,0,0,0.8)']} 
                style={styles.imageOverlay}
              />
            </View>
            <View style={styles.albumInfo}>
              <View>
                <Text style={styles.albumName}>{item.name}</Text>
                <Text style={styles.albumDate}>Last modified recently</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sectionHeaderContent: {
    flexDirection: 'column',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  sectionCount: {
    color: '#ffffffb7',
    fontSize: 14,
    marginTop: 4,
  },
  albumCard: {
    backgroundColor: '#111',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  albumInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  albumName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  albumDate: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});