import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Check, SquareCheckBig, X, Video } from 'lucide-react-native';
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useSelection } from '@/context/SelectionContext';
import { mediaLibraryScanner, ImageFile } from '@/services/mediaLibraryScanner';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 4;
const IMAGE_SIZE = SCREEN_WIDTH / COLUMN_COUNT;

type ListItem = 
  | { type: 'header'; title: string; count: number; images: ImageFile[] }
  | { type: 'row'; id: string; images: ImageFile[] };

interface TransitionContextType {
  startTransition: (img: ImageFile, layout: { x: number; y: number; width: number; height: number }) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export default function Index() {
  const { isSelectionMode, selectedImages, setSelectionMode, setSelectedImages } = useSelection();
  const [allImages, setAllImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  
  const isInitialLoad = useRef(true);

  const navigateToImageView = (img: ImageFile) => {
    router.push({
      pathname: '/image-view',
      params: {
        uri: img.uri,
        id: img.id,
      },
    });
  };

  const startTransition = (img: ImageFile, layout: { x: number; y: number; width: number; height: number }) => {
    navigateToImageView(img);
  };

  const listData = useMemo(() => {
    const groups = mediaLibraryScanner.groupByDate(allImages);
    const items: ListItem[] = [];

    groups.forEach(group => {
      items.push({
        type: 'header',
        title: group.date,
        count: group.count,
        images: group.images,
      });

      for (let i = 0; i < group.images.length; i += COLUMN_COUNT) {
        const rowImages = group.images.slice(i, i + COLUMN_COUNT);
        items.push({
          type: 'row',
          id: `row-${group.date}-${i}`,
          images: rowImages,
        });
      }
    });

    return items;
  }, [allImages]);

  const stickyHeaderIndices = useMemo(() => {
    return listData
      .map((item, index) => (item.type === 'header' ? index : -1))
      .filter((index) => index !== -1);
  }, [listData]);

  const loadImages = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else if (isInitialLoad.current) setIsLoading(true);

    try {
      const hasPermission = await mediaLibraryScanner.requestPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Photo library permission is required.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Load from cache first if initial load
      if (isInitialLoad.current) {
        const cached = await mediaLibraryScanner.loadFromCache();
        if (cached && cached.length > 0) {
          setAllImages(cached);
          setIsLoading(false);
          // Don't return, still fetch fresh data
        }
      }

      const result = await mediaLibraryScanner.scanAllAssets(100, isRefresh ? undefined : endCursor);
      
      setAllImages(prev => {
        if (isRefresh) return result.images;
        // Filter out duplicates
        const existingIds = new Set(prev.map(img => img.id));
        const newImages = result.images.filter(img => !existingIds.has(img.id));
        return [...prev, ...newImages];
      });

      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isInitialLoad.current = false;
    }
  }, [endCursor]);

  const toggleImageSelection = useCallback((imageId: string) => {
    const newSet = new Set(selectedImages);
    if (newSet.has(imageId)) {
      newSet.delete(imageId);
    } else {
      newSet.add(imageId);
    }
    setSelectedImages(newSet);
  }, [selectedImages, setSelectedImages]);

  const handleLongPress = useCallback((imageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    const newSet = new Set(selectedImages);
    newSet.add(imageId);
    setSelectedImages(newSet);
  }, [selectedImages, setSelectedImages, setSelectionMode]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      const allSelected = item.images.every(img => selectedImages.has(img.id));
      return (
        <View style={styles.sectionHeader}>
          {isSelectionMode && (
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  const newSet = new Set(selectedImages);
                  if (allSelected) {
                    item.images.forEach(img => newSet.delete(img.id));
                  } else {
                    item.images.forEach(img => newSet.add(img.id));
                  }
                  setSelectedImages(newSet);
                }}
              >
                <View style={[styles.headerCheckboxContainer, allSelected && styles.checkboxSelected]}>
                  {allSelected && <Check size={16} color="white" />}
                </View>
              </TouchableOpacity>
            </BlurView>
          )}
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.sectionCount}>{item.count} items</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.row}>
        {item.images.map((img) => (
          <ImageItem
            key={img.id}
            img={img}
            isSelectionMode={isSelectionMode}
            isSelected={selectedImages.has(img.id)}
            onPress={() => toggleImageSelection(img.id)}
            onLongPress={() => handleLongPress(img.id)}
          />
        ))}
      </View>
    );
  }, [isSelectionMode, selectedImages, toggleImageSelection, handleLongPress, setSelectedImages]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoading && !isRefreshing) {
      loadImages(false);
    }
  }, [hasNextPage, isLoading, isRefreshing, loadImages]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return (
    <TransitionContext.Provider value={{ startTransition }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
        {isLoading && allImages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Scanning photos...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={40}
              tint="dark"
              style={[styles.selectButton, styles.Button, { paddingHorizontal: isSelectionMode ? 13 : 10 }]}
            >
              {isSelectionMode && (
                <TouchableOpacity
                  style={styles.selectButtonContainer}
                  activeOpacity={1}
                  onPress={() => {
                    const allSelected = allImages.every(img => selectedImages.has(img.id));
                    if (allSelected) {
                      setSelectedImages(new Set());
                    } else {
                      setSelectedImages(new Set(allImages.map(img => img.id)));
                    }
                  }}
                >
                  <View style={[styles.headerCheckboxContainer, allImages.every(img => selectedImages.has(img.id)) && styles.checkboxSelected]}>
                    {allImages.every(img => selectedImages.has(img.id)) && <Check size={16} color="white" />}
                  </View>
                  <Text style={styles.selectButtonText}>Select All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedImages(new Set());
                }}
              >
                {isSelectionMode ? <X size={24} color="white" /> : <SquareCheckBig size={24} color="white" />}
              </TouchableOpacity>
            </BlurView>

            <FlashList
              data={listData}
              renderItem={renderItem}
              keyExtractor={(item) => item.type === 'header' ? `header-${item.title}` : item.id}
              estimatedItemSize={IMAGE_SIZE + 20}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              onRefresh={() => loadImages(true)}
              refreshing={isRefreshing}
              contentContainerStyle={{ paddingBottom: 100 }}
              stickyHeaderIndices={stickyHeaderIndices}
              getItemType={(item) => item.type}
            />
          </View>
        )}
      </SafeAreaView>
    </TransitionContext.Provider>
  );
}

interface ImageItemProps {
  img: ImageFile;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const ImageItem = ({ img, isSelectionMode, isSelected, onPress, onLongPress }: ImageItemProps) => {
  const context = useContext(TransitionContext);

  const handlePress = () => {
    if (isSelectionMode) {
      onPress();
      return;
    }
    context?.startTransition(img, { x: 0, y: 0, width: 0, height: 0 });
  };

  const isVideo = img.uri.match(/\.(mp4|mov|avi|mkv|webm)$/i) !== null;

  return (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={200}
      activeOpacity={0.8}
    >
      <ExpoImage
        source={{ uri: img.uri }}
        style={[styles.image, isSelectionMode && isSelected && styles.imageSelected]}
        contentFit="cover"
        cachePolicy="disk"
        recyclingKey={img.id}
        transition={200}
      />
      {isVideo && (
        <View style={styles.videoIconContainer}>
          <Video size={16} color="white" />
        </View>
      )}
      {isSelectionMode && (
         <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
           {isSelected && <Check size={14} color="white" />}
         </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  Button: {
    padding: 10,
    borderRadius: 50,
    overflow: 'hidden',
    borderColor: '#6d6d6d88',
    borderWidth: 2,
    flexDirection: 'row',
    gap: 20,
  },
  selectButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  selectButtonContainer: {
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
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  sectionHeaderContent: {
    flexDirection: 'column',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionCount: {
    color: '#ffffffb7',
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 1,
  },
  imageContainer: {
    width: '25%',
    aspectRatio: 1,
    padding: 1,
  },
  image: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  imageSelected: {
    opacity: 0.6,
  },
  videoIconContainer: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 3,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  headerCheckboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});