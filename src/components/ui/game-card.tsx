"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';


interface GameCardProps {
  handleShuffle: () => void;
  onSelect: (game: any) => void; // Replace 'any' with your Game type if you have one
  game: any;                     // Replace 'any' with your Game type if you have one
  position: any;
}

export function GameCard({ handleShuffle, onSelect, game, position }: GameCardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === "front";

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? "2" : position === "middle" ? "1" : "0",
        touchAction: "none" // Prevents the page from scrolling while you swipe the card
      }}
      animate={{
        rotate: position === "front" ? "-4deg" : position === "middle" ? "0deg" : "4deg",
        // Adjusted X offset for smaller mobile screens
        x: position === "front" ? "0%" : position === "middle" ? "25%" : "50%",
        scale: position === "front" ? 1 : 0.95,
        opacity: position === "back" ? 0.4 : 1
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={(_, info) => {
        dragRef.current = info.point.x;
      }}
      onDragEnd={(_, info) => {
        // Use info.offset.x for more reliable mobile swipe detection
        if (info.offset.x < -100) {
          handleShuffle();
        }
        dragRef.current = 0;
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      // Responsive width: 280px on tiny phones, 320px on desktop
      className={`absolute left-0 top-0 flex h-[400px] w-[280px] md:h-[420px] md:w-[320px] flex-col rounded-[2.5rem] border border-white/60 bg-white/40 p-6 md:p-8 shadow-xl backdrop-blur-2xl transition-colors ${
        isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
    >
      <div className="relative h-32 md:h-40 w-full mb-4 md:mb-6 overflow-hidden rounded-3xl border border-white/40">
        <img src={game.img} alt={game.title} className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
        <h3 className="text-xl md:text-2xl font-semibold text-slate-700">{game.title}</h3>
        <p className="text-xs md:text-sm font-light text-slate-500 leading-relaxed px-2">
          {game.description}
        </p>
      </div>

      {isFront && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onSelect(game.id)}
          className="mt-auto flex items-center justify-center gap-2 w-full py-3 md:py-4 rounded-2xl bg-emerald-500/80 text-white font-medium shadow-lg active:scale-95 transition-all"
        >
          <Play size={16} fill="currentColor" />
          Start Session
        </motion.button>
      )}

      {isFront && (
        <span className="absolute -bottom-10 left-0 w-full text-center text-[10px] font-bold tracking-widest text-emerald-600/40 uppercase">
          ← Swipe left
        </span>
      )}
    </motion.div>
  );
}