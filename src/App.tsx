import { useState } from 'react';
import { App as KonstaApp, Page } from 'konsta/react'; 

import LandingPage from './components/LandingPage';
import Drums from './components/Drums';
import Piano from './components/Piano';
import Guitar from './components/Guitar';

function App() {
  const [activeScreen, setActiveScreen] = useState<string>('splash');

  const goToMenu = () => setActiveScreen('landing');

  return (
    <KonstaApp theme="parent">
      <Page>
        
        {/* --- SPLASH SCREEN --- */}
        {activeScreen === 'splash' && (
          <div className="h-full w-full flex flex-col justify-center items-center relative overflow-hidden">
            
            {/* 1. Background: Matched to your Piano Game (Emerald/Teal/Cyan Light Theme) */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 z-0" />
            
            {/* Optional: Very subtle ambient orbs to enhance the glass effect */}
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl mix-blend-multiply" />
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl mix-blend-multiply" />

            {/* 2. Logo Container */}
            <div className="z-10 flex flex-col items-center mb-16 animate-fade-in relative">
              
              {/* The Logo */}
              <img 
                src="/assets/icon.png" 
                alt="Logo" 
                className="
                  w-48 h-48 
                  object-cover 
                  rounded-[2.5rem] /* Heavily curved corners (Squircle) */
                  shadow-xl 
                  border-[3px] border-white/60 /* Subtle glass border */
                  relative z-10
                "
              />

              {/* Transparent "Floating" Shadow below logo */}
              <div className="
                absolute -bottom-6 
                w-32 h-6 
                bg-emerald-700/20 /* Darker emerald for shadow */
                blur-xl 
                rounded-full
                z-0
              " />
            </div>

            {/* 3. Simple Liquid Glass Button */}
            <div className="z-10 w-full max-w-xs px-8">
              <button
                onClick={() => setActiveScreen('landing')}
                className="
                  w-full
                  py-4
                  text-lg font-bold tracking-wide
                  text-emerald-900 
                  
                  /* Liquid Glass Effect for Light Mode */
                  bg-white/40
                  backdrop-blur-xl
                  border border-white/60
                  shadow-[0_8px_30px_rgba(0,0,0,0.05)]
                  
                  /* Shape */
                  rounded-2xl
                  
                  /* Hover/Active States */
                  hover:bg-white/60
                  active:scale-95
                  transition-all duration-300 ease-out
                  
                  /* Shine effect */
                  relative overflow-hidden
                  before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-50
                "
              >
                Start
              </button>
            </div>
            
          </div>
        )}

        {/* --- MAIN MENU --- */}
        {activeScreen === 'landing' && (
          <LandingPage onSelectGame={(id: string) => setActiveScreen(id)} />
        )}

        {/* --- GAMES --- */}
        {activeScreen === 'game1' && (
          <Drums onBack={goToMenu} />
        )}

        {activeScreen === 'game2' && (
          <Piano onBack={goToMenu} />
        )}
        
        {activeScreen === 'game3' && (
          <Guitar onBack={goToMenu} />
        )}

      </Page>
    </KonstaApp>
  );
}

export default App;