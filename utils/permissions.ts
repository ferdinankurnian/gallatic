import { Platform, PermissionsAndroid } from 'react-native';

export async function requestStoragePermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const readGranted = granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
      const writeGranted = granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;

      return readGranted && writeGranted;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting storage permissions:', error);
    return false;
  }
}

export async function checkStoragePermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.check('android.permission.READ_EXTERNAL_STORAGE');
      return result;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking storage permissions:', error);
    return false;
  }
}
