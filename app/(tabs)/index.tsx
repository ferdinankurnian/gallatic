import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, SquareCheckBig, X } from 'lucide-react-native';
import { createContext, useContext } from 'react';
import { Dimensions, Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelection } from '@/context/SelectionContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageData {
  id: string;
  uri: string;
}

interface TransitionContextType {
  startTransition: (img: ImageData, layout: { x: number; y: number; width: number; height: number }) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

interface ImageItemProps {
  img: ImageData;
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

  return (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={200}
    >
      <Image
        source={{ uri: img.uri }}
        style={[styles.image, isSelectionMode && isSelected && styles.imageSelected]}
      />
      {isSelectionMode && (
        <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color="white" />}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function Index() {
  const { isSelectionMode, selectedImages, setSelectionMode, setSelectedImages } = useSelection();



  const navigateToImageView = (img: ImageData) => {
    router.push({
      pathname: '/image-view',
      params: {
        uri: img.uri,
        id: img.id,
      },
    });
  };

  const startTransition = (img: ImageData, layout: { x: number; y: number; width: number; height: number }) => {
    navigateToImageView(img);
  };

  const groupImagesIntoRows = (images: ImageData[]) => {
    const rows: { id: string; images: ImageData[] }[] = [];
    for (let i = 0; i < images.length; i += 4) {
      rows.push({
        id: `row-${i}`,
        images: images.slice(i, i + 4),
      });
    }
    return rows;
  };

  const toggleImageSelection = (imageId: string) => {
    const newSet = new Set(selectedImages);
    if (newSet.has(imageId)) {
      newSet.delete(imageId);
    } else {
      newSet.add(imageId);
    }
    setSelectedImages(newSet);
  };

  const selectAllInSection = (images: ImageData[]) => {
    const newSet = new Set(selectedImages);
    images.forEach(img => newSet.add(img.id));
    setSelectedImages(newSet);
  };

  const handleLongPress = (imageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    const newSet = new Set(selectedImages);
    newSet.add(imageId);
    setSelectedImages(newSet);
  };

  const sections = [
    {
      title: 'Today',
      count: 12,
      images: [
        { id: '1', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
        { id: '2', uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop' },
        { id: '3', uri: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop' },
        { id: '4', uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop' },
        { id: '5', uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop' },
        { id: '6', uri: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=400&fit=crop' },
        { id: '7', uri: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop' },
        { id: '8', uri: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop' },
        { id: '9', uri: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&h=400&fit=crop' },
        { id: '10', uri: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&h=400&fit=crop' },
        { id: '11', uri: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=400&fit=crop' },
        { id: '12', uri: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=400&fit=crop' },
      ],
    },
    {
      title: 'Yesterday',
      count: 8,
      images: [
        { id: '13', uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=400&fit=crop' },
        { id: '14', uri: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop' },
        { id: '15', uri: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=400&fit=crop' },
        { id: '16', uri: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&h=400&fit=crop' },
        { id: '17', uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop' },
        { id: '18', uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop' },
        { id: '19', uri: 'https://images.unsplash.com/photo-1445964047600-cdbdb873673d?w=400&h=400&fit=crop' },
        { id: '20', uri: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop' },
      ],
    },
    {
      title: '11 Jan',
      count: 7,
      images: [
        { id: '21', uri: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=400&fit=crop' },
        { id: '22', uri: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=400&fit=crop' },
        { id: '23', uri: 'https://images.unsplash.com/photo-1446329813274-7c9036bd9a1f?w=400&h=400&fit=crop' },
        { id: '24', uri: 'https://images.unsplash.com/photo-1484100356142-db6ab6244067?w=400&h=400&fit=crop' },
        { id: '25', uri: 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?w=400&h=400&fit=crop' },
        { id: '26', uri: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=400&h=400&fit=crop' },
        { id: '27', uri: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?w=400&h=400&fit=crop' },
      ],
    },
  ];

  const transformedSections = sections.map(section => ({
    title: section.title,
    count: section.count,
    images: section.images,
    data: groupImagesIntoRows(section.images),
  }));

  return (
    <TransitionContext.Provider value={{ startTransition }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
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
                const allImages = sections.flatMap(s => s.images);
                const allSelected = allImages.every(img => selectedImages.has(img.id));
                if (allSelected) {
                  setSelectedImages(new Set());
                } else {
                  setSelectedImages(new Set(allImages.map(img => img.id)));
                }
              }}
            >
              <View style={[styles.headerCheckboxContainer, sections.flatMap(s => s.images).every(img => selectedImages.has(img.id)) && styles.checkboxSelected]}>
                {sections.flatMap(s => s.images).every(img => selectedImages.has(img.id)) && <Check size={16} color="white" />}
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

        <SectionList
          sections={transformedSections}
          keyExtractor={(item) => item.id}
          overScrollMode="never"
          stickySectionHeadersEnabled={true}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={styles.sectionHeader}>
              {isSelectionMode && (
                <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      const allSelected = section.images.every(img => selectedImages.has(img.id));
                      if (allSelected) {
                        const newSet = new Set(selectedImages);
                        section.images.forEach(img => newSet.delete(img.id));
                        setSelectedImages(newSet);
                      } else {
                        selectAllInSection(section.images);
                      }
                    }}
                  >
                    <View style={[styles.headerCheckboxContainer, section.images.every(img => selectedImages.has(img.id)) && styles.checkboxSelected]}>
                      {section.images.every(img => selectedImages.has(img.id)) && <Check size={16} color="white" />}
                    </View>
                  </TouchableOpacity>
                </BlurView>
              )}
              <View style={styles.sectionHeaderContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.count} items</Text>
              </View>
            </LinearGradient>
          )}
          renderItem={({ item }) => (
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
          )}
        />
      </SafeAreaView>
    </TransitionContext.Provider>
  );
}

const styles = StyleSheet.create({
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
    top: 75,
    right: 20,
    zIndex: 1,
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
  },
  sectionHeaderContent: {
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
  imageSelected: {
    opacity: 0.5,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});