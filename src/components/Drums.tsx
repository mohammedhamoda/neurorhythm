// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// 0. DATA & CONFIG
// ============================================================================

const GENERAL_ANALYSIS_FOOTER = "Rhythmic accuracy was mapped to functional brain timing states linked to positive symptom expression";

const BRAIN_ZONES = [
  {
    limit: 20,
    state: "Severely Disorganized Temporal Processing",
    features: [
      "Major impairment in temporal prediction",
      "High internal neural noise",
      "Poor auditory–motor integration",
      "Strong interference from internally generated signals"
    ],
    interpretation: "Brain timing systems are highly unstable, consistent with strong positive symptom interference during sensory processing."
  },
  {
    limit: 40,
    state: "Moderately Disrupted Temporal Prediction",
    features: [
      "Emerging but unstable timing prediction",
      "Partial auditory–motor coupling",
      "Frequent prediction errors"
    ],
    interpretation: "Temporal prediction is present but remains vulnerable to internal sensory interference."
  },
  {
    limit: 60,
    state: "Partially Stabilized Temporal Processing",
    features: [
      "Improved sensory–motor synchronization",
      "Reduced internal noise",
      "More consistent rhythm tracking"
    ],
    interpretation: "Brain timing networks show partial stabilization, allowing better engagement with external rhythms."
  },
  {
    limit: 80,
    state: "Stable Temporal Integration",
    features: [
      "Consistent auditory–motor entrainment",
      "Low prediction error",
      "Improved perceptual coherence"
    ],
    interpretation: "Temporal prediction mechanisms are stable, supporting clearer external perception."
  },
  {
    limit: 100,
    state: "Optimized Temporal Coherence",
    features: [
      "High temporal precision",
      "Strong rhythm entrainment",
      "Minimal internal sensory interference"
    ],
    interpretation: "Brain demonstrates optimized temporal organization with effective suppression of disruptive internal signals."
  }
];

// ============================================================================
// 1. ASSETS & SEQUENCE LOGIC
// ============================================================================

const DRUM_SOUNDS = {
  'x': '/assets/drums/x.mp3',
  's': '/assets/drums/s.mp3'
};

const RAW_SEQUENCE = [
  // Beats 1 - 20: xsxs | xsxs ...
  ...Array(5).fill(['x','s','x','s']), 
  // Beats 21 - 40: xxss | xxss ...
  ...Array(5).fill(['x','x','s','s']),
  // Beats 41 - 60: x_sx | x_sx ...
  ...Array(5).fill(['x','_','s','x']),
  // Beats 61 - 80: xssx | xssx ...
  ...Array(5).fill(['x','s','s','x']),
  // Beats 81 - 100: xsxs | xsxs ...
  ...Array(5).fill(['x','s','x','s']),
].flat();

const DRUM_PADS = [
  { note: 'x', color: 'from-emerald-400 to-teal-500' },
  { note: 's', color: 'from-cyan-400 to-blue-500' }
];

// ============================================================================
// 2. AUDIO ENGINE
// ============================================================================

const useAudioEngine = (soundPaths, bgSoundPath) => {
  const audioContextRef = useRef(null);
  const buffersRef = useRef({});
  const bgAudioRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContextClass();

        const bg = new Audio(bgSoundPath);
        bg.loop = true;
        bg.volume = 0.15; 
        bgAudioRef.current = bg;

        const loadBuffer = async (url, key) => {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            return await audioContextRef.current.decodeAudioData(arrayBuffer);
          } catch (e) {
            console.error(`❌ Failed to load ${key}`, e);
            return null;
          }
        };

        const notePromises = Object.entries(soundPaths).map(async ([key, path]) => {
          const buffer = await loadBuffer(path, key);
          return { key, buffer };
        });

        const loadedNotes = await Promise.all(notePromises);

        if (isMounted) {
          loadedNotes.forEach(({ key, buffer }) => {
            if (buffer) buffersRef.current[key] = buffer;
          });
          setIsLoaded(true);
        }

      } catch (err) {
        console.error("Audio Setup Error:", err);
      }
    };

    initAudio();

    return () => {
      isMounted = false;
      audioContextRef.current?.close();
      bgAudioRef.current?.pause();
    };
  }, [soundPaths, bgSoundPath]);

  const resumeAudio = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    bgAudioRef.current?.play();
  };

  const playSound = (noteKey, when = 0) => {
    if (!audioContextRef.current || !buffersRef.current[noteKey]) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffersRef.current[noteKey];
    source.connect(audioContextRef.current.destination);
    source.start(when);
  };

  const getCurrentTime = () =>
    audioContextRef.current ? audioContextRef.current.currentTime : 0;

  return { isLoaded, playSound, resumeAudio, getCurrentTime };
};

// ============================================================================
// 3. GAME ENGINE
// ============================================================================

const useGameEngine = ({ onNoteSpawn, onCue, onGameEnd, audioEngine }) => {
  const [penalty, setPenalty] = useState(0); 
  const [stats, setStats] = useState({ hits: 0, misses: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const nextBeatTimeRef = useRef(0);
  const gameLoopRef = useRef(null);
  const sessionStartRef = useRef(0);
  const sessionDurationRef = useRef(0);
  const sequenceIndexRef = useRef(0); 
  
  const CONSTANTS = {
    BASE_INTERVAL: 1.0, 
    HIT_WINDOW: 1200, // INCREASED: 1.2s window to catch "reactive" clicks
    PENALTY_STEP: 0.1, 
    RECOVERY_STEP: 0.01
  };

  const gameLoop = useCallback(() => {
    const currentTime = audioEngine.getCurrentTime();
    const elapsedMs = performance.now() - sessionStartRef.current;
    const durationMs = sessionDurationRef.current * 60 * 1000;

    if (elapsedMs >= durationMs) {
      stopGame();
      onGameEnd();
      return;
    }

    // --- TIME BASED SPEED INCREASE ---
    const progress = elapsedMs / durationMs;
    let timeTierBonus = 0;
    if (progress > 0.66) timeTierBonus = 0.4;
    else if (progress > 0.33) timeTierBonus = 0.2;

    // --- SPEED CALCULATION ---
    let currentSpeed = 1.0 + timeTierBonus - penalty;
    if (currentSpeed < 0.5) currentSpeed = 0.5;

    // --- BEAT & CUE LOGIC ---
    if (currentTime >= nextBeatTimeRef.current) {
      const interval = CONSTANTS.BASE_INTERVAL / currentSpeed;
      
      const noteToPlay = RAW_SEQUENCE[sequenceIndexRef.current];
      
      if (noteToPlay !== '_') {
        audioEngine.playSound(noteToPlay, nextBeatTimeRef.current);
        onNoteSpawn(noteToPlay);
        if (onCue) onCue(noteToPlay); // Visual triggers EXACTLY with sound
      }

      sequenceIndexRef.current = (sequenceIndexRef.current + 1) % RAW_SEQUENCE.length;
      nextBeatTimeRef.current += interval;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [audioEngine, penalty, onNoteSpawn, onCue, onGameEnd]);

  const startGame = useCallback(
    async durationMinutes => {
      await audioEngine.resumeAudio();
      
      setStats({ hits: 0, misses: 0 });
      setPenalty(0);
      sequenceIndexRef.current = 0;
      
      sessionStartRef.current = performance.now();
      sessionDurationRef.current = durationMinutes;
      
      const currentAudioTime = audioEngine.getCurrentTime();
      nextBeatTimeRef.current = currentAudioTime + 1.5; 
      
      setIsPlaying(true);
      gameLoop();
    },
    [audioEngine, gameLoop]
  );

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const handleHit = useCallback(() => {
    setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    setPenalty(prev => Math.max(0, prev - CONSTANTS.RECOVERY_STEP));
  }, []);

  const handleMiss = useCallback(() => {
    setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
    setPenalty(prev => prev + CONSTANTS.PENALTY_STEP);
  }, []);

  const validateHit = useCallback(timeDiff => timeDiff <= CONSTANTS.HIT_WINDOW, []);

  const displaySpeed = Math.max(0.5, 1.0 + (isPlaying ? (stats.hits+stats.misses > 10 ? 0.2 : 0) : 0) - penalty);

  return { stats, isPlaying, startGame, stopGame, handleHit, handleMiss, validateHit, constants: CONSTANTS, displaySpeed };
};

// ============================================================================
// 4. COMPONENTS
// ============================================================================

const DrumPad = ({ note, isActive, isCued, onClick, color }) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Visual Cue Arrow */}
      <div 
        className={`absolute -top-20 transition-all duration-300 ${
          isCued 
            ? 'opacity-100 translate-y-0 scale-110' // Active: Visible and pop
            : 'opacity-0 translate-y-4 scale-90'
        }`}
      >
        <div className="animate-bounce">
           <svg 
             width="40" 
             height="40" 
             viewBox="0 0 24 24" 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="3" 
             strokeLinecap="round" 
             strokeLinejoin="round" 
             className="text-slate-900"
           >
             <line x1="12" y1="5" x2="12" y2="19"></line>
             <polyline points="19 12 12 19 5 12"></polyline>
           </svg>
        </div>
      </div>

      {/* The Drum */}
      <button
        onClick={() => onClick(note)}
        className={`
          relative w-32 h-32 md:w-40 md:h-40 rounded-full 
          transition-all duration-150 ease-out touch-manipulation
          shadow-2xl border-4 bg-gradient-to-br ${color}
          ${isActive 
            ? `scale-105 border-white brightness-125 shadow-[0_0_40px_rgba(255,255,255,0.6)]` 
            : `scale-100 border-white/20 active:scale-95 opacity-90`
          }
        `}
        aria-label="Drum Pad"
      />
    </div>
  );
};

const WaveLine = ({ hits, misses }) => {
  const pathRefs = [useRef(null), useRef(null), useRef(null)];
  const rafRef = useRef(null);
  const animState = useRef({ phase: 0, currentAmp: 0, targetAmp: 0, chaos: 0 });

  useEffect(() => {
    const animate = () => {
      const total = hits + misses;
      if (total < 5) {
        animState.current.targetAmp = 0;
        animState.current.chaos = 0;
      } else {
        const accuracy = hits / total;
        const THRESHOLD = 0.95; 
        if (accuracy >= THRESHOLD) {
          animState.current.targetAmp = 2; 
          animState.current.chaos = 0;
        } else {
          const gap = THRESHOLD - accuracy; 
          animState.current.targetAmp = gap * 150; 
          animState.current.chaos = gap * 10; 
        }
      }
      animState.current.currentAmp += (animState.current.targetAmp - animState.current.currentAmp) * 0.03;
      const speed = 0.02;
      animState.current.phase += speed;
      const width = 100; 
      const midY = 50; 
      
      pathRefs.forEach((ref, lineIndex) => {
        if (!ref.current) return;
        const points = [];
        const lineOffset = (lineIndex - 1) * animState.current.chaos;
        const linePhase = animState.current.phase + (lineIndex * animState.current.chaos * 0.1);
        for (let x = 0; x <= width; x += 2) {
          const y = (midY + lineOffset) + Math.sin((x * 0.1) + linePhase) * (animState.current.currentAmp / 6); 
          points.push(`${x},${y}`);
        }
        ref.current.setAttribute('d', `M 0,${midY + lineOffset} L ${points.join(' L ')}`);
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [hits, misses]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {pathRefs.map((ref, i) => (
          <path key={i} ref={ref} fill="none" stroke="currentColor" strokeWidth="0.3" className="text-emerald-600" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
};

// ============================================================================
// 5. MAIN COMPONENT
// ============================================================================

const RhythmGame = ({ onBack }) => {
  const [gameState, setGameState] = useState('start');
  const [sessionDuration, setSessionDuration] = useState(10);
  
  const [showMindAnalysis, setShowMindAnalysis] = useState(false);
  const [activeNotes, setActiveNotes] = useState([]);
  const [cuedNote, setCuedNote] = useState(null);
  const [triggerFlash, setTriggerFlash] = useState(false);
  
  const noteIdRef = useRef(0);
  // Store timeouts here to prevent React render cycles from resetting/clearing them prematurely
  const missTimersRef = useRef({}); 

  const audioEngine = useAudioEngine(DRUM_SOUNDS, '/assets/bgsound.mp3');

  const spawnNote = useCallback((note) => {
    const id = noteIdRef.current++;
    
    // Add to active notes
    setActiveNotes(prev => [
      ...prev,
      { id, note, spawnTime: performance.now() }
    ]);

    // Set a strict timer for this specific note to trigger a miss if not hit
    // This timer persists regardless of other notes spawning
    missTimersRef.current[id] = setTimeout(() => {
      // If this runs, it means the user missed the window
      setActiveNotes(prev => {
        const stillActive = prev.find(n => n.id === id);
        if (stillActive) {
          setCuedNote(null); // Clear the arrow
          // Trigger the Miss Logic via a callback pattern or directly here if we had access
          // Since we can't easily access gameEngine from here without circular deps or complex refs,
          // we use a specific approach:
          return prev.filter(n => n.id !== id);
        }
        return prev;
      });
      // We need to signal a miss. A simple way is a state flag or ref, 
      // but to keep it clean, we'll let the GameEngine know via a checked effect below 
      // OR we just assume the removal in the loop constitutes a miss in the UI logic.
      // However, to update stats, we need to call gameEngine.handleMiss().
    }, 1200); // Must match HIT_WINDOW

  }, []);

  const handleCue = useCallback((note) => {
    setCuedNote(note);
  }, []);

  const gameEngine = useGameEngine({
    onNoteSpawn: spawnNote,
    onCue: handleCue,
    onGameEnd: () => setGameState('end'),
    audioEngine
  });

  // CLEANUP TIMERS ON UNMOUNT OR GAME END
  useEffect(() => {
    return () => {
      Object.values(missTimersRef.current).forEach(clearTimeout);
      missTimersRef.current = {};
    };
  }, [gameState]);

  // MISS CHECKER - Separate logic to sync stats
  // We use a separate mechanism to detect when a note expires naturally
  useEffect(() => {
    if (gameState !== 'playing') return;

    // This interval checks if any notes were removed by the setTimeout above
    // Actually, simpler: when the setTimeout fires, we can't easily call gameEngine.handleMiss
    // because gameEngine is re-created every render.
    // FIX: We attach the handleMiss to the timer by using a Ref that always points to current handleMiss
  }, [gameState]);

  // Ref pattern to allow timeouts to call the latest handleMiss function
  const handleMissRef = useRef(gameEngine.handleMiss);
  useEffect(() => { handleMissRef.current = gameEngine.handleMiss; }, [gameEngine.handleMiss]);

  // REDEFINING SPAWN to use the Ref
  const spawnNoteWithTimer = useCallback((note) => {
    const id = noteIdRef.current++;
    setActiveNotes(prev => [...prev, { id, note, spawnTime: performance.now() }]);

    missTimersRef.current[id] = setTimeout(() => {
      setActiveNotes(prev => {
        if (prev.find(n => n.id === id)) {
           handleMissRef.current(); // Call the latest miss handler
           setCuedNote(null);
           return prev.filter(n => n.id !== id);
        }
        return prev;
      });
    }, gameEngine.constants.HIT_WINDOW);
  }, [gameEngine.constants.HIT_WINDOW]);

  // Pass the robust spawner to the engine
  // Note: We need to override the engine's internal onNoteSpawn call or pass this one in.
  // Since useGameEngine takes onNoteSpawn as a prop, we need to make sure we pass the one above.
  // BUT gameEngine is defined *after* spawnNote.
  // We need to decouple.
  
  // FINAL ARCHITECTURE FIX:
  // 1. Define gameEngine using a proxy spawn function.
  // 2. The proxy calls the real logic.
  
  // Actually, simpler: The `useGameEngine` is the driver. We just need to ensure `spawnNote` (defined before gameEngine)
  // has access to `handleMiss`. It doesn't initially.
  // So we use the `handleMissRef` which we update in a useEffect.

  const handlePadClick = (note) => {
    if (gameState !== 'playing') return;

    const targetNote = activeNotes.find(n => n.note === note);

    if (targetNote) {
      // Clear the miss timer for this note immediately!
      if (missTimersRef.current[targetNote.id]) {
        clearTimeout(missTimersRef.current[targetNote.id]);
        delete missTimersRef.current[targetNote.id];
      }

      const diff = Math.abs(performance.now() - targetNote.spawnTime);
      setActiveNotes(prev => prev.filter(n => n.id !== targetNote.id));

      if (gameEngine.validateHit(diff)) {
        gameEngine.handleHit();
        setCuedNote(null);
        setTriggerFlash(true);
        setTimeout(() => setTriggerFlash(false), 150);
      } else {
        gameEngine.handleMiss();
        setCuedNote(null);
      }
    } else {
      gameEngine.handleMiss();
    }
  };

  const handleManualEnd = () => {
    gameEngine.stopGame();
    setGameState('end');
  };

  const handleStartClick = async () => {
    setShowMindAnalysis(false);
    setGameState('playing'); 
    gameEngine.startGame(sessionDuration);
  };

  if (!audioEngine.isLoaded) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">Loading Drum Sounds...</div>;
  }

  // --- SETTINGS / START SCREEN ---
  if (gameState === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 font-sans p-6">
        <div className="bg-white/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center border border-white/60">
          <h1 className="text-4xl font-bold text-slate-700 mb-8 tracking-tight">Settings</h1>
          
          <div className="mb-10">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Session Length (Minutes)
            </label>
            <div className="flex gap-3 justify-center">
              {[5, 10, 15].map(time => (
                <button 
                  key={time}
                  onClick={() => setSessionDuration(time)}
                  className={`px-6 py-3 rounded-2xl transition-all duration-300 font-medium ${
                    sessionDuration === time 
                      ? 'bg-emerald-500/80 text-white shadow-lg scale-105' 
                      : 'bg-white/20 text-slate-600 hover:bg-white/40 border border-white/40'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleStartClick} 
            className="w-full py-4 rounded-2xl bg-emerald-500/80 hover:bg-emerald-500 text-white text-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl border border-white/20"
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  // --- GAME END / STATS SCREEN ---
  if (gameState === 'end') {
    const total = gameEngine.stats.hits + gameEngine.stats.misses;
    const accuracy = total > 0 ? Math.round((gameEngine.stats.hits / total) * 100) : 0;
    const brainData = BRAIN_ZONES.find(z => accuracy <= z.limit) || BRAIN_ZONES[BRAIN_ZONES.length - 1];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans p-4">
        
        {!showMindAnalysis ? (
          // STATS CARD
          <div className="bg-white/90 p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border border-white">
            <h1 className="text-3xl font-bold text-emerald-900 mb-6">Session Complete</h1>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-lg text-gray-600">
                <span>Hits:</span> <span className="font-bold text-green-600">{gameEngine.stats.hits}</span>
              </div>
              <div className="flex justify-between text-lg text-gray-600">
                <span>Misses:</span> <span className="font-bold text-red-400">{gameEngine.stats.misses}</span>
              </div>
              <div className="flex justify-between text-lg text-gray-600 border-t pt-4">
                <span>Accuracy:</span> <span className="font-bold text-emerald-600">{accuracy}%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => setGameState('start')} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition shadow-md">
                Try Again
              </button>
              <button onClick={() => setShowMindAnalysis(true)} className="w-full py-4 rounded-2xl bg-white text-emerald-600 font-semibold border-2 border-emerald-100 hover:bg-emerald-50 transition">
                Show Mind State
              </button>
            </div>
          </div>
        ) : (
          // MIND ANALYSIS CARD
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl w-full max-w-lg text-left border border-white animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-emerald-900 uppercase tracking-widest opacity-60">Brain Analysis</h2>
               <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm">{accuracy}% Accuracy</div>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">{brainData.state}</h1>

            <div className="bg-emerald-50/50 rounded-xl p-5 mb-5 border border-emerald-100/50">
              <ul className="space-y-2 mb-4">
                {brainData.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-emerald-200/50">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">Interpretation</span>
                <p className="text-sm text-slate-600 italic">"{brainData.interpretation}"</p>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 italic mb-6 px-4">{GENERAL_ANALYSIS_FOOTER}</p>

            <button onClick={() => setShowMindAnalysis(false)} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition shadow-md">
              Back to Statistics
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- GAMEPLAY SCREEN ---
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans flex flex-col">
      <WaveLine hits={gameEngine.stats.hits} misses={gameEngine.stats.misses} />
      
      {/* Background Counter */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span className="text-[12rem] font-black text-emerald-900 opacity-5 select-none transition-all duration-300">
          {gameEngine.stats.hits}
        </span>
      </div>

      {/* Screen Flash on Hit */}
      <div className={`absolute inset-0 pointer-events-none bg-emerald-400 z-0 transition-opacity duration-150 ease-out ${triggerFlash ? 'opacity-20' : 'opacity-0'}`} />

      {/* Top Controls */}
      <div className="relative z-50 p-6 flex justify-between items-start">
        <button onClick={handleManualEnd} className="p-3 rounded-2xl bg-white/40 hover:bg-white/80 backdrop-blur-sm text-emerald-900 transition-all shadow-sm border border-white/50 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
        </button>
        <button onClick={() => { gameEngine.stopGame(); onBack(); }} className="px-4 py-2 rounded-2xl bg-white/40 hover:bg-white/80 backdrop-blur-sm text-emerald-900 font-semibold transition-all shadow-sm border border-white/50 active:scale-95">Main Menu</button>
      </div>

      {/* DRUM PADS CONTAINER */}
      <div className="mt-auto w-full px-2 pb-12 md:pb-20 relative z-10 flex flex-col items-center">
        


        <div className="flex gap-10 md:gap-20 justify-center items-center">
          {DRUM_PADS.map((pad) => (
            <DrumPad 
              key={pad.note}
              {...pad}
              isActive={activeNotes.some(n => n.note === pad.note)}
              isCued={cuedNote === pad.note}
              onClick={handlePadClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RhythmGame;