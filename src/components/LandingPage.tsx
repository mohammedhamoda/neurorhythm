// @ts-nocheck
import React, { useState } from 'react';
import { GameCard } from './ui/game-card';

const gameOptions = [
  { 
    id: 'game1', 
    title: 'Drums', 
    description: 'Play with a drum kit with quiet background sound',
    img: '/assets/drums.webp' 
  },
  { 
    id: 'game2', 
    title: 'Piano', 
    description: 'Play with a Piano notes with quiet background sound',
    img: '/assets/piano.webp' 
  },
  { 
    id: 'game3', 
    title: 'Guitar', 
    description: 'Play with a Piano notes with quiet background sound',
    img: '/assets/guitar.webp' 
  },
];

const LandingPage = ({ onSelectGame }) => {
  const [positions, setPositions] = useState(["front", "middle", "back"]);

  const handleShuffle = () => {
    setPositions((prev) => {
      const newPositions = [...prev];
      // Remove the '!' at the end of .pop()
      const poppedItem = newPositions.pop(); 
      if (poppedItem) {
        newPositions.unshift(poppedItem);
      }
      return newPositions;
    });
  };

 return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f9ff] font-sans p-4 md:p-6 overflow-hidden relative">
      
      {/* Therapeutic Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-emerald-100/40 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[5%] right-[-5%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px]" />

      <div className="text-center mb-8 md:mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-light text-slate-700 mb-2 tracking-tight">
          Choose<span className="font-medium text-emerald-500/70"> Instrument</span>
        </h1>
        <p className="text-slate-400 text-xs md:text-sm tracking-widest uppercase font-medium">Select the instrument you want to play</p>
      </div>

      {/* Card Stack Container - Centered on mobile, offset on desktop */}
      <div className="relative z-20 h-[420px] w-[300px] md:h-[450px] md:w-[320px] md:mr-32 transition-transform duration-500 max-md:scale-95">
        {gameOptions.map((game, index) => (
          <GameCard
            key={game.id}
            id={index + 1}
            game={game}
            onSelect={onSelectGame}
            handleShuffle={handleShuffle}
            position={positions[index]}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;