// @ts-nocheck
import React, { useState } from 'react';
import { GameCard } from './ui/game-card';

const allGameOptions = [
  { 
    id: 'game1', 
    title: 'Drums', 
    description: 'Play with a drum kit',
    img: '/assets/drums.webp' 
  },
  { 
    id: 'game2', 
    title: 'Piano', 
    description: 'Play with Piano notes',
    img: '/assets/piano.webp' 
  },
  { 
    id: 'game3', 
    title: 'Guitar', 
    description: 'Play with Guitar',
    img: '/assets/guitar.webp' 
  },
];

const LandingPage = ({ onSelectGame, user, userRole, onLogout, isAdmin }) => {
  
  const visibleGames = allGameOptions;
  
  // Logic to stack cards: Front, Middle, Back
  const [positions, setPositions] = useState(visibleGames.length > 1 ? ["front", "middle", "back"] : ["front"]);

  const handleShuffle = () => {
    if (visibleGames.length <= 1) return;
    setPositions((prev) => {
      const newPositions = [...prev];
      const poppedItem = newPositions.pop(); 
      if (poppedItem) {
        newPositions.unshift(poppedItem);
      }
      return newPositions;
    });
  };

  return (
    // Main Container: Fixed to screen, no scrollbars, no rubber-banding
    <div className="fixed inset-0 h-full w-full flex flex-col items-center justify-center bg-[#f0f9ff] font-sans p-4 md:p-6 overflow-hidden select-none touch-none">
      
      {/* Admin Button */}
      {isAdmin && (
        <button 
          onClick={() => onSelectGame('admin')} 
          className="absolute top-12 left-6 z-50 px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg active:scale-95 transition-transform"
        >
          Admin
        </button>
      )}
      
      {/* Profile & Logout Buttons */}
      {user && (
         <div className="absolute top-12 right-6 z-50 flex gap-4">
             <button 
               onClick={() => onSelectGame('profile')} 
               className="p-2 bg-white rounded-full shadow active:scale-95 transition-transform"
             >
                <span className="text-sm font-bold text-slate-700 px-2">Profile</span>
             </button>
             <button 
               onClick={onLogout} 
               className="text-red-500 font-bold text-sm px-2 active:opacity-70"
             >
               Logout
             </button>
         </div>
      )}

      {/* Header Text */}
      <div className="text-center mb-8 md:mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-light text-slate-700 mb-2 tracking-tight">
          Your <span className="font-medium text-emerald-500/70">Instruments</span>
        </h1>
        {/* <p className="text-slate-400 text-xs md:text-sm tracking-widest uppercase font-medium">
           {userRole ? `You are logged in as a ${userRole}` : 'Select an instrument'}
        </p> */}
      </div>

      {/* Cards Container */}
      <div className="relative z-20 h-[420px] w-[300px] md:h-[450px] md:w-[320px]">
        {visibleGames.map((game, index) => (
          <GameCard
            key={game.id}
            id={index + 1}
            game={game}
            onSelect={onSelectGame}
            handleShuffle={handleShuffle}
            position={positions[index] || "front"} 
          />
        ))}
        
        {visibleGames.length === 0 && (
           <div className="text-center text-slate-500 mt-20">No instruments found for your role.</div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;