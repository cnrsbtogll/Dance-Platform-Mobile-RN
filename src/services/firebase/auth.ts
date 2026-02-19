import { 
  Auth, 
  getAuth, 
  signInWithCredential, 
  GoogleAuthProvider, 
  OAuthProvider,
  User,
  signOut as firebaseSignOut,
  updateProfile,
  deleteUser as deleteFirebaseUser
} from 'firebase/auth';
import app from './config'; // Assuming firebase app is initialized in config.ts
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

console.log('[AuthService] Environment Check:');
console.log('[AuthService] Constants.executionEnvironment:', Constants.executionEnvironment);
console.log('[AuthService] Constants.appOwnership:', Constants.appOwnership);
console.log('[AuthService] isExpoGo detected:', isExpoGo);

export let GoogleSignin: any = {
  configure: () => {},
  hasPlayServices: async () => {},
  signIn: async () => {},
  signOut: async () => {},
};
export let statusCodes: any = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

if (!isExpoGo) {
  try {
    const googleSigninPackage = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninPackage.GoogleSignin;
    statusCodes = googleSigninPackage.statusCodes;
  } catch (error) {
    console.error('[AuthService] Failed to require @react-native-google-signin/google-signin:', error);
  }
}

const auth: Auth = getAuth(app);

// Configure Google Sign-In
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

console.log('[AuthService] Configuring Google Sign-In');
console.log('[AuthService] Web Client ID present:', !!webClientId);
console.log('[AuthService] iOS Client ID present:', !!iosClientId);

if (!isExpoGo) {
  try {
    GoogleSignin.configure({
      webClientId: webClientId, // Get this from Firebase Console for Web
      iosClientId: iosClientId, // Explicitly pass for iOS if plist fails
      offlineAccess: true,
    });
  } catch (error) {
    console.error('[AuthService] Google Sign-In Configuration Error:', error);
  }
} else {
  console.log('[AuthService] Skipped Google Sign-In configuration (Expo Go detected)');
}

export const signInWithGoogle = async () => {
  console.log('[AuthService] signInWithGoogle called');
  
  if (isExpoGo) {
    console.warn('[AuthService] Google Sign-In is not supported in Expo Go');
    throw new Error('GOOGLE_SIGN_IN_NOT_SUPPORTED_IN_EXPO_GO');
  }

  try {
    console.log('[AuthService] Checking Play Services...');
    await GoogleSignin.hasPlayServices();
    console.log('[AuthService] Play Services available, signing in...');
    const userInfo = await GoogleSignin.signIn();
    
    // Check if idToken exists before proceeding
    if (!userInfo.data?.idToken) {
      throw new Error('Google Sign-In failed: No idToken received');
    }

    const { idToken } = userInfo.data;
    console.log('[AuthService] Google Sign-In successful, idToken received');
    const credential = GoogleAuthProvider.credential(idToken);
    
    console.log('[AuthService] Signing in to Firebase with credential...');
    return await signInWithCredential(auth, credential);
  } catch (error: any) {
    console.error('[AuthService] Google Sign-In Error Full Object:', JSON.stringify(error, null, 2));
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled the login flow
      console.log('User cancelled Google Sign-In');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // operation (e.g. sign in) is in progress already
      console.log('Google Sign-In in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // play services not available or outdated
      console.log('Play services not available');
    } else {
      // some other error happened
      console.error('Google Sign-In Error:', error);
    }
    throw error;
  }
};

export const signInWithApple = async () => {
  console.log('[AuthService] signInWithApple called');
  try {
    console.log('[AuthService] Requesting Apple Sign-In...');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken, authorizationCode } = credential;

    if (!identityToken) {
        throw new Error('Apple Sign-In failed: No identityToken received');
    }

    console.log('[AuthService] Apple Sign-In successful, identityToken received');
    const provider = new OAuthProvider('apple.com');
    
    const firebaseCredential = provider.credential({
        idToken: identityToken,
        accessToken: authorizationCode || undefined, // rawNonce is not directly available in credential, checked docs
    });

    console.log('[AuthService] Signing in to Firebase with credential...');
    console.log('[AuthService] Signing in to Firebase with credential...');
    const userCredential = await signInWithCredential(auth, firebaseCredential);

    // If Apple returned a name (only on first login), update the Firebase profile
    if (credential.fullName) {
      const name = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');
      
      if (name) {
        console.log('[AuthService] Updating Firebase profile with Apple name:', name);
        await updateProfile(userCredential.user, { displayName: name });
      }
    }

    return userCredential;

  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      // handle that the user canceled the sign-in flow
      console.log('User cancelled Apple Sign-In');
    } else {
      // handle other errors
       console.error('Apple Sign-In Error:', e);
    }
    throw e;
  }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        try {
            if (!isExpoGo) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            // Include logic to ignore error if user was not signed in with Google
             console.log('Google Sign-Out Error (ignorable):', error);
        }
    } catch (error) {
        console.error('Sign Out Error:', error);
        throw error;
    }
}

export const deleteAccount = async () => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user to delete');
        
        await deleteFirebaseUser(user);
        console.log('[AuthService] Firebase account deleted');
    } catch (error) {
        console.error('Delete Account Error:', error);
        throw error;
    }
}

export { auth };
