import { CustomTabBar } from '@/components/TabBar';
import { Tabs } from 'expo-router';
import { SelectionProvider } from '@/context/SelectionContext';

export default function TabLayout() {
    return (
        <SelectionProvider>
            <Tabs
                tabBar={(props) => <CustomTabBar {...props} />}
            >
                <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, }} />
                <Tabs.Screen name="album" options={{ title: 'Album', headerShown: false, }} />
                <Tabs.Screen name="search" options={{ title: 'Search', headerShown: false, }} />
            </Tabs>
        </SelectionProvider>
    );
}
