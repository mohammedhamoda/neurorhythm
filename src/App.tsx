import { useState, useEffect } from 'react';

// UI Framework
import { App as KonstaApp, Page } from 'konsta/react';

// Firebase
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

// Capacitor
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { App as CapApp } from '@capacitor/app';

// Components
import LandingPage from './components/LandingPage';
import Drums from './components/Drums';
import Piano from './components/Piano';
import Guitar from './components/Guitar';
import ProfilePage from './components/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import RoleSelection from './components/RoleSelection';

// --- Icons ---
// 1. Added Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function App() {
  const [activeScreen, setActiveScreen] = useState<string>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Navigation Helper
  const goToMenu = () => setActiveScreen('landing');

  // 1. Back Button Listener
  useEffect(() => {
    let backButtonListener: any;
    const setupListener = async () => {
      backButtonListener = await CapApp.addListener('backButton', () => {
        const rootScreens = ['splash', 'landing', 'role-select'];
        if (rootScreens.includes(activeScreen)) {
          CapApp.exitApp();
        } else {
          goToMenu();
        }
      });
    };
    setupListener();
    return () => { if (backButtonListener) backButtonListener.remove(); };
  }, [activeScreen]);

  // 2. Auth & Database Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setActiveScreen('splash');
        setIsAuthChecking(false);
        return;
      }

      setUser(currentUser);
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(data.isAdmin === true);
          if (data.role) {
            setUserRole(data.role);
            setActiveScreen('landing');
          } else {
            setActiveScreen('role-select');
          }
        } else {
          setActiveScreen('role-select');
        }
      } catch (error) {
        console.error("Persistence sync error:", error);
        setActiveScreen('splash');
      } finally {
        setIsAuthChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Login Handler
  const handleLogin = async () => {
    try {
      setLoading(true);

      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        const idToken = result.credential?.idToken;
        const accessToken = result.credential?.accessToken;

        if (!idToken) throw new Error("Native Login failed: No ID Token found");

        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        await signInWithCredential(auth, credential);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout Handler
  const handleLogout = async () => {
    try {
      setLoading(true);
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoading(false);
    }
  };

  // --- UI Renders ---
  const renderLoading = () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-emerald-50 absolute inset-0 z-[100]">
      <div className="animate-spin h-12 w-12 border-4 border-emerald-500 rounded-full border-t-transparent mb-4"></div>
      <p className="text-emerald-700 font-medium">Syncing profile...</p>
    </div>
  );

  // 5. Updated Splash Screen to use Google Styling
  const renderSplash = () => (
    <div className="h-full w-full flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl" />
      <div className="z-10 flex flex-col items-center mb-16">
        <img src="/assets/icon.png" alt="Logo" className="w-48 h-48 object-cover rounded-[2.5rem] shadow-xl border-[3px] border-white/60" />
      </div>
      
      <div className="z-10 w-full max-w-xs px-8">
        <button 
          onClick={handleLogin} 
          disabled={loading}
          // White background, gray text, flex layout for icon alignment
          className="w-full py-3.5 px-4 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 shadow-lg rounded-xl border border-gray-200 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
             <span className="font-semibold">Signing in...</span>
          ) : (
             <>
               <GoogleIcon />
               <span className="font-roboto font-semibold text-lg">Sign in with Google</span>
             </>
          )}
        </button> 
      </div>
    </div>
  );

  return (
    <KonstaApp theme="parent">
      <Page>
        {isAuthChecking && renderLoading()}
        {!isAuthChecking && loading && renderLoading()}
        {!isAuthChecking && activeScreen === 'splash' && renderSplash()}

        {!isAuthChecking && activeScreen === 'role-select' && user && (
          <RoleSelection user={user} onRoleSet={(role) => {
            setUserRole(role);
            setActiveScreen('landing');
          }} />
        )}

        {!isAuthChecking && activeScreen === 'landing' && (
          <LandingPage 
            onSelectGame={(id: string) => setActiveScreen(id)} 
            user={user}
            userRole={userRole}
            isAdmin={isAdmin}
            onLogout={handleLogout}
          />
        )}

        {activeScreen === 'game1' && <Drums onBack={goToMenu} user={user} userRole={userRole} />}
        {activeScreen === 'game2' && <Piano onBack={goToMenu} user={user} userRole={userRole} />}
        {activeScreen === 'game3' && <Guitar onBack={goToMenu} user={user} userRole={userRole} />}
        {activeScreen === 'profile' && user && <ProfilePage onBack={goToMenu} user={user} />}
        {activeScreen === 'admin' && user && <AdminDashboard onBack={goToMenu} />}
      </Page>
    </KonstaApp>
  );
}

export default App;