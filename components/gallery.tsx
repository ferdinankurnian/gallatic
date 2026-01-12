import { Image, SectionList, StyleSheet, Text, View } from 'react-native';

export default function GalleryScreen() {
    const sections = [
        {
            title: 'Today',
            count: 26,
            data: [
                { id: '1', uri: 'https://...' },
                { id: '2', uri: 'https://...' },
                // ... gambar-gambar lainnya
            ],
        },
        {
            title: 'Yesterday',
            count: 15,
            data: [
                { id: '3', uri: 'https://...' },
                // ...
            ],
        },
        {
            title: 'Last Week',
            count: 42,
            data: [
                // ...
            ],
        },
    ];

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={true} // INI KUNCINYA!
            renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionCount}>{section.count} items</Text>
                </View>
            )}
            renderItem={({ item }) => (
                <Image source={{ uri: item.uri }} style={styles.image} />
            )}
        />
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        backgroundColor: '#000', // PENTING: kasih background biar ga transparent
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    sectionCount: {
        color: '#888',
        fontSize: 14,
        marginTop: 4,
    },
    image: {
        width: '33%',
        aspectRatio: 1,
    },
});