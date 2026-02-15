// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- SHARED DATA ---
import { 
  BRAIN_ZONES, 
  ROLE_GENERAL_NOTES, 
  GENERAL_ANALYSIS_FOOTER, 
  getBrainState 
} from './brainZonesData';

// ============================================================================
// 1. ASSETS & CLIENT DATA MAPPING
// ============================================================================

const PIANO_SOUNDS = {
  'G3': '/assets/piano/G3.mp3', 'A3': '/assets/piano/A3.mp3', 'B3': '/assets/piano/B3.mp3',
  'C4': '/assets/piano/C4.mp3', 'D4': '/assets/piano/D4.mp3', 'E4': '/assets/piano/E4.mp3',
  'F4': '/assets/piano/F4.mp3', 'G4': '/assets/piano/G4.mp3', 'A4': '/assets/piano/A4.mp3',
  'B4': '/assets/piano/B4.mp3', 'C5': '/assets/piano/C5.mp3', 'D5': '/assets/piano/D5.mp3',
  'E5': '/assets/piano/E5.mp3'
};

// --- FIX #2: EXPANDED KEYS ---
// Added B3, B4, D5, E5 so they have visuals when the song plays them
const PIANO_KEYS = [
  'G3', 'A3', 'B3', 
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 
  'C5', 'D5', 'E5'
];

// --- NEW: Background Music Mapping ---
const ROLE_BG_MUSIC = {
  'Schizophrenia': '/assets/bg/schizophrenia.mp3',
  'Autism Spectrum Disorder': '/assets/bg/autism.mp3',
  'Depression': '/assets/bg/depression.mp3',
  'ADHD': '/assets/bg/adhd.mp3',
  'Anxiety': '/assets/bg/bgsound.mp3',
  // Fallback
  'default': '/assets/bg/bgsound.mp3'
};

// Mapped from Client Documentation Tables
const ROLE_SEQUENCES = {
  'Schizophrenia': [
    ['C4', 'G4', 'A4', 'C5'], 
    ['D4', 'A4', 'B4', 'D5'], 
    ['E4', 'B4', 'C5', 'E5'] 
  ],
  'Autism Spectrum Disorder': [
    ['C4', 'E4', 'G4', 'C5'],
    ['D4', 'F4', 'A4', 'D5'],
    ['E4', 'G4', 'B4', 'E5']
  ],
  'Depression': [
    ['A3', 'C4', 'E4'],
    ['G3', 'B3', 'D4'],
    ['A3', 'D4', 'F4']
  ],
  'ADHD': [
    ['C4', 'E4', 'G4', 'E4'],
    ['F4', 'A4', 'C5', 'A4'],
    ['D4', 'F4', 'A4', 'F4']
  ],
  'Anxiety': [
    ['E4', 'G4', 'A4', 'G4'],
    ['D4', 'F4', 'G4', 'F4'],
    ['E4', 'G4', 'B4', 'G4']
  ],
  // Fallback
  'default': [
    ['C4', 'G4', 'A4', 'F4'],
    ['C4', 'G4', 'A4', 'F4']
  ]
};

// Clinical Tempo Logic Engine
const calculateClientTempo = (role, loopCount) => {
  const T = 0.5; 

  switch (role) {
    case 'Schizophrenia':
      return T * Math.pow(1.10, Math.floor(loopCount / 3));

    case 'Autism Spectrum Disorder':
      return T * Math.pow(1.12, Math.floor(loopCount / 2));

    case 'Depression':
      if (loopCount === 0) return T;
      return T * Math.pow(1.18, 1 + Math.floor((loopCount - 1) / 2));

    case 'ADHD':
      if (loopCount <= 2) {
        return T * Math.pow(1.2, loopCount);
      } else {
        return T * Math.pow(1.2, 2 + Math.floor((loopCount - 2) / 2));
      }

    case 'Anxiety':
      const cyclePos = Math.floor(loopCount / 2) % 2; 
      return cyclePos === 1 ? T * 1.17 : T;

    default:
      return T;
  }
};

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
    setIsLoaded(false); 

    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }

        if (bgAudioRef.current) {
          bgAudioRef.current.pause();
          bgAudioRef.current = null;
        }
        const bg = new Audio(bgSoundPath);
        bg.loop = true;
        bg.volume = 0.05; 
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

        if (Object.keys(buffersRef.current).length === 0) {
            const notePromises = Object.entries(soundPaths).map(async ([key, path]) => {
            const buffer = await loadBuffer(path, key);
            return { key, buffer };
            });

            const loadedNotes = await Promise.all(notePromises);
            
            if (isMounted) {
                loadedNotes.forEach(({ key, buffer }) => {
                    if (buffer) buffersRef.current[key] = buffer;
                });
            }
        }

        if (isMounted) {
          setIsLoaded(true);
        }

      } catch (err) {
        console.error("Audio Setup Error:", err);
      }
    };

    initAudio();

    return () => {
      isMounted = false;
      bgAudioRef.current?.pause();
    };
  }, [soundPaths, bgSoundPath]);

  const resumeAudio = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    try {
        await bgAudioRef.current?.play();
    } catch (e) {
        console.warn("Autoplay blocked or failed:", e);
    }
  };

  const playTone = (noteKey, when = 0) => {
    if (!audioContextRef.current || !buffersRef.current[noteKey]) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffersRef.current[noteKey];
    
    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.setValueAtTime(1.0, when);
    gainNode.gain.exponentialRampToValueAtTime(0.01, when + 2.0); 

    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    source.start(when);
  };

  const getCurrentTime = () =>
    audioContextRef.current ? audioContextRef.current.currentTime : 0;

  return { isLoaded, playTone, resumeAudio, getCurrentTime };
};

// ============================================================================
// 3. GAME ENGINE
// ============================================================================

const useGameEngine = ({ onNoteSpawn, onGameEnd, audioEngine, sequence, userRole }) => {
  const [accuracyMultiplier, setAccuracyMultiplier] = useState(1); 
  const [stats, setStats] = useState({ hits: 0, misses: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const nextBeatTimeRef = useRef(0);
  const gameLoopRef = useRef(null);
  const sessionStartRef = useRef(0);
  const sessionDurationRef = useRef(0);
  
  const consecutiveMissesRef = useRef(0);
  const loopIterationRef = useRef(0); 
  const segmentIndexRef = useRef(0); 
  const noteIndexRef = useRef(0); 

  const CONSTANTS = {
    BASE_INTERVAL_SECONDS: 1.0,
    // --- FIX #1: INCREASED TIME WINDOW ---
    // Increased from 800 to 1500 to give user more time to click
    HIT_WINDOW: 1500, 
    MIN_ACCURACY_MULT: 0.5, 
    MISSES_TO_SLOW_DOWN: 2,
    SLOW_DOWN_FACTOR: 0.9,
    RECOVERY_FACTOR: 1.02 
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

    const clinicalTempoMult = calculateClientTempo(userRole, loopIterationRef.current);
    const finalSpeed = clinicalTempoMult * accuracyMultiplier;

    if (currentTime >= nextBeatTimeRef.current) {
      const interval = CONSTANTS.BASE_INTERVAL_SECONDS / finalSpeed;
      
      const currentSegment = sequence[segmentIndexRef.current];

      if (currentSegment && currentSegment.length > 0) {
          const noteToPlay = currentSegment[noteIndexRef.current];
          
          audioEngine.playTone(noteToPlay, nextBeatTimeRef.current);
          onNoteSpawn(noteToPlay);

          noteIndexRef.current++;
          
          if (noteIndexRef.current >= currentSegment.length) {
              noteIndexRef.current = 0;
              segmentIndexRef.current++;
              
              if (segmentIndexRef.current >= sequence.length) {
                  segmentIndexRef.current = 0;
                  loopIterationRef.current++; 
              }
          }
      }

      nextBeatTimeRef.current += interval;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [audioEngine, accuracyMultiplier, onNoteSpawn, onGameEnd, sequence, userRole]);

  const startGame = useCallback(
    async durationMinutes => {
      await audioEngine.resumeAudio();
      
      setStats({ hits: 0, misses: 0 });
      setAccuracyMultiplier(1);
      
      consecutiveMissesRef.current = 0;
      
      loopIterationRef.current = 0;
      segmentIndexRef.current = 0;
      noteIndexRef.current = 0;
      
      sessionStartRef.current = performance.now();
      sessionDurationRef.current = durationMinutes;
      
      const currentAudioTime = audioEngine.getCurrentTime();
      nextBeatTimeRef.current = currentAudioTime + 1.0; 
      
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
    consecutiveMissesRef.current = 0;
    setAccuracyMultiplier(prev => Math.min(prev * CONSTANTS.RECOVERY_FACTOR, 1.0));
  }, [CONSTANTS.RECOVERY_FACTOR]);

  const handleMiss = useCallback(() => {
    setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
    consecutiveMissesRef.current++;
    
    if (consecutiveMissesRef.current >= CONSTANTS.MISSES_TO_SLOW_DOWN) {
      setAccuracyMultiplier(prev => Math.max(prev * CONSTANTS.SLOW_DOWN_FACTOR, CONSTANTS.MIN_ACCURACY_MULT));
      consecutiveMissesRef.current = 0; 
    }
  }, [CONSTANTS.MISSES_TO_SLOW_DOWN, CONSTANTS.SLOW_DOWN_FACTOR, CONSTANTS.MIN_ACCURACY_MULT]);

  const validateHit = useCallback(timeDiff => timeDiff <= CONSTANTS.HIT_WINDOW, []);

  const displaySpeed = (1.0) * accuracyMultiplier; 

  return { stats, speedMultiplier: displaySpeed, isPlaying, startGame, stopGame, handleHit, handleMiss, validateHit, constants: CONSTANTS };
};

// ============================================================================
// 4. COMPONENTS
// ============================================================================

const PianoKey = ({ note, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(note)}
      className={`
        relative flex-1 h-48 md:h-64 rounded-b-lg border-x border-b border-gray-200/50 shadow-sm transition-all duration-100 ease-out touch-manipulation
        flex flex-col justify-end items-center pb-4 select-none
        ${isActive 
          ? 'bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.5)] -translate-y-1 z-10 scale-[1.02]' 
          : 'bg-white/90 hover:bg-white active:scale-95'
        }
      `}
    >
      <span className={`font-bold text-xs md:text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
        {note}
      </span>
      <div className={`absolute inset-0 rounded-b-lg bg-gradient-to-t from-emerald-200/40 to-transparent pointer-events-none transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
    </button>
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

const RhythmGame = ({ onBack, user, userRole }) => {
  const [gameState, setGameState] = useState('start');
  const [sessionDuration, setSessionDuration] = useState(10);
  
  const sessionStartTimeRef = useRef(null);
  const [showMindAnalysis, setShowMindAnalysis] = useState(false);
  const [activeNotes, setActiveNotes] = useState([]);
  const [triggerFlash, setTriggerFlash] = useState(false);
  const noteIdRef = useRef(0);

  const activeBgMusic = useMemo(() => {
     return ROLE_BG_MUSIC[userRole] || ROLE_BG_MUSIC['default'];
  }, [userRole]);

  const audioEngine = useAudioEngine(PIANO_SOUNDS, activeBgMusic);

  const activeSequence = useMemo(() => {
     return ROLE_SEQUENCES[userRole] || ROLE_SEQUENCES['default'];
  }, [userRole]);

  // --- FIX #3: ONE KEY AT A TIME ---
  const spawnNote = useCallback((note) => {
    const id = noteIdRef.current++;
    // Replaced the '...' spread operator with a new array containing ONLY the new note.
    // This ensures that when a new note spawns, the old one is removed immediately.
    setActiveNotes([
      {
        id,
        note,
        spawnTime: performance.now()
      }
    ]);
  }, []);

  // --------------------------------------------------------------------------
  // SAVE LOGIC
  // --------------------------------------------------------------------------
  const saveSessionToFirebase = useCallback(async (currentHits, currentMisses) => {
    if (!user || !sessionStartTimeRef.current) return;

    try {
      const endTime = Date.now();
      const timeSpentMs = endTime - sessionStartTimeRef.current;
      const timeSpentSeconds = Math.floor(timeSpentMs / 1000);
      const total = currentHits + currentMisses;
      const accuracy = total > 0 ? Math.round((currentHits / total) * 100) : 0;
      
      await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        game: "Piano",
        hits: currentHits,
        misses: currentMisses,
        accuracy: accuracy,
        intendedDurationMinutes: sessionDuration,
        timeSpentSeconds: timeSpentSeconds,
        timestamp: serverTimestamp()
      });
      console.log("Session saved.");
    } catch (e) {
      console.error("Error saving session: ", e);
    }
  }, [user, sessionDuration]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleNaturalEnd = () => {
      saveSessionToFirebase(gameEngine.stats.hits, gameEngine.stats.misses);
      setGameState('end');
  };

  const gameEngine = useGameEngine({
    onNoteSpawn: spawnNote,
    onGameEnd: handleNaturalEnd,
    audioEngine,
    sequence: activeSequence,
    userRole 
  });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timers = activeNotes.map(activeNote =>
      setTimeout(() => {
        setActiveNotes(prev => {
          const exists = prev.find(n => n.id === activeNote.id);
          if (exists) {
            gameEngine.handleMiss();
          }
          return prev.filter(n => n.id !== activeNote.id);
        });
      }, gameEngine.constants.HIT_WINDOW)
    );

    return () => timers.forEach(clearTimeout);
  }, [activeNotes, gameState, gameEngine]);

  const handleKeyClick = (note) => {
    if (gameState !== 'playing') return;

    const targetNote = activeNotes.find(n => n.note === note);

    if (targetNote) {
      const diff = Math.abs(performance.now() - targetNote.spawnTime);
      setActiveNotes(prev => prev.filter(n => n.id !== targetNote.id));

      if (gameEngine.validateHit(diff)) {
        gameEngine.handleHit();
        setTriggerFlash(true);
        setTimeout(() => setTriggerFlash(false), 200);
      } else {
        gameEngine.handleMiss();
      }
    } else {
      gameEngine.handleMiss();
    }
  };

  const handleManualEnd = async () => {
    gameEngine.stopGame();
    await saveSessionToFirebase(gameEngine.stats.hits, gameEngine.stats.misses);
    setGameState('end');
  };

  const handleMainMenu = async () => {
    gameEngine.stopGame();
    await saveSessionToFirebase(gameEngine.stats.hits, gameEngine.stats.misses);
    onBack();
  };

  const handleStartClick = async () => {
    setShowMindAnalysis(false);
    sessionStartTimeRef.current = Date.now();
    setGameState('playing'); 
    gameEngine.startGame(sessionDuration);
  };

  if (!audioEngine.isLoaded) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">Loading Clinical Assets...</div>;
  }

  const glassBtnClass = "backdrop-blur-md bg-white/30 border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] text-emerald-900 transition-all hover:bg-white/50 active:scale-95";

  // SETTINGS SCREEN
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
          
          <button 
            onClick={onBack}
            className="mt-4 w-full py-3 rounded-2xl bg-white/30 hover:bg-white/50 text-slate-600 font-medium transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // END SCREEN
  if (gameState === 'end') {
    const total = gameEngine.stats.hits + gameEngine.stats.misses;
    const accuracy = total > 0 ? Math.round((gameEngine.stats.hits / total) * 100) : 0;
    
    const brainData = getBrainState(userRole, accuracy);
    const generalRoleNote = ROLE_GENERAL_NOTES[userRole] || ROLE_GENERAL_NOTES['default'] || "Analysis unavailable for this role.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans p-4">
        {!showMindAnalysis ? (
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
              <button onClick={() => setGameState('start')} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition shadow-md">Try Again</button>
              <button onClick={onBack} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition">Main Menu</button>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl w-full max-w-lg text-left border border-white animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-emerald-900 uppercase tracking-widest opacity-60">Brain Analysis</h2>
               <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm">{accuracy}% Accuracy</div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">{brainData ? brainData.state : "Analysis Inconclusive"}</h1>
            <div className="bg-emerald-50/50 rounded-xl p-5 mb-5 border border-emerald-100/50">
              <ul className="space-y-2 mb-4">
                {brainData && brainData.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>{feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-emerald-200/50">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">Interpretation</span>
                <p className="text-sm text-slate-600 italic">"{brainData ? brainData.interpretation : "No data available."}"</p>
              </div>
            </div>
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Clinical Context</span>
               <p className="text-sm text-slate-600 font-medium leading-relaxed">{generalRoleNote}</p>
            </div>
            <p className="text-xs text-center text-gray-400 italic mb-6 px-4">{GENERAL_ANALYSIS_FOOTER}</p>
            <button onClick={() => setShowMindAnalysis(false)} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition shadow-md">Back to Statistics</button>
          </div>
        )}
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans flex flex-col">
      <WaveLine hits={gameEngine.stats.hits} misses={gameEngine.stats.misses} />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span className="text-[12rem] font-black text-emerald-900 opacity-5 select-none transition-all duration-300">
          {gameEngine.stats.hits}
        </span>
      </div>

      <div className={`absolute inset-0 pointer-events-none bg-emerald-400 z-0 transition-opacity duration-200 ease-out ${triggerFlash ? 'opacity-20' : 'opacity-0'}`} />

      <div className="relative z-50 p-6 flex justify-between items-start">
        <button onClick={handleManualEnd} className={`p-3 rounded-2xl ${glassBtnClass}`} aria-label="End Session">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
        </button>
        <button onClick={handleMainMenu} className={`px-6 py-2 rounded-2xl font-semibold ${glassBtnClass}`}>Main Menu</button>
      </div>

      <div className="mt-auto w-full px-2 md:px-10 pb-6 md:pb-10 relative z-10">
        <div className="relative overflow-hidden bg-gradient-to-b from-white/60 to-white/20 backdrop-blur-xl p-4 md:p-6 rounded-t-[3rem] border border-white/50 shadow-[0_-8px_30px_rgba(255,255,255,0.4)]">
          <div className="pointer-events-none absolute top-0 inset-x-20 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent z-20"></div>
          <div className="flex gap-1 md:gap-2 relative z-10">
            {PIANO_KEYS.map((note, index) => (
              <PianoKey 
                key={`${note}-${index}`} 
                note={note} 
                isActive={activeNotes.some(n => n.note === note)} 
                onClick={handleKeyClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RhythmGame;