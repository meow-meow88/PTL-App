import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Defined OAuth Scopes required for Google Drive automation
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Initialize Firebase App safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Token and User persistence across page reloads
const STORAGE_KEY_TOKEN = 'ptl_google_access_token';
const STORAGE_KEY_USER = 'ptl_google_user_profile';

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: any = null;

try {
  cachedAccessToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const storedUser = localStorage.getItem(STORAGE_KEY_USER);
  if (storedUser) {
    cachedUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.warn('Storage read warning:', e);
}

// Auth state listeners
type AuthListener = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthListener>();

export const subscribeAuthChange = (listener: AuthListener) => {
  listeners.add(listener);
  // Emit immediately with current state
  listener(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener(cachedUser, cachedAccessToken));
};

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedUser = user;
      try {
        const profile = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
        };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      } catch {}

      if (cachedAccessToken) {
        notifyListeners();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        notifyListeners();
      }
    } else {
      if (!cachedAccessToken) {
        cachedUser = null;
        notifyListeners();
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

// Interactive sign-in with Google
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;

    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, cachedAccessToken);
      const profile = {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        uid: result.user.uid,
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }

    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    } catch {}
  }
  return cachedAccessToken;
};

export const getCurrentUser = (): any => {
  return cachedUser || auth.currentUser;
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch {}
  cachedAccessToken = null;
  cachedUser = null;
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {}
  notifyListeners();
};
