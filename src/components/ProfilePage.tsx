import { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// --- Types ---
interface Session {
  id: string;
  game: string;
  accuracy: number;
  hits: number;
  misses: number;
  timestamp: any;
  // Added optional fields to match your data structure
  timeSpentSeconds?: number;
  intendedDurationMinutes?: number;
}

interface ProfilePageProps {
  user: User;
  onBack: () => void;
}

const ProfilePage = ({ user, onBack }: ProfilePageProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats State
  const [stats, setStats] = useState({
    totalGames: 0,
    averageAccuracy: 0
  });

  // State to handle broken image links (e.g. expired Google URLs)
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchUserSessions = async () => {
      try {
        setLoading(true);
        
        // 1. Query: Get sessions ONLY for this user
        const q = query(
          collection(db, "sessions"), 
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        
        const fetchedSessions: Session[] = [];
        let totalAccuracy = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Session;
          fetchedSessions.push({ ...data, id: doc.id });
          totalAccuracy += (data.accuracy || 0);
        });

        // 2. Client-side Sort (safest to avoid missing index errors)
        fetchedSessions.sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA; // Descending (newest first)
        });

        // 3. Set Data & Stats
        setSessions(fetchedSessions);
        setStats({
          totalGames: fetchedSessions.length,
          averageAccuracy: fetchedSessions.length > 0 
            ? Math.round(totalAccuracy / fetchedSessions.length) 
            : 0
        });

      } catch (error) {
        console.error("Error fetching profile sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserSessions();
    }
  }, [user]);

  // Helper to format time
  const formatTime = (seconds?: number) => {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in relative flex flex-col max-h-[90vh]">
        
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-emerald-400 to-teal-500 relative shrink-0">
            <button 
              onClick={onBack}
              className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition flex items-center gap-2 px-4"
            >
              ← Back
            </button>
        </div>

        {/* Avatar & Info */}
        <div className="px-8 text-center relative shrink-0">
          <div className="w-24 h-24 mx-auto -mt-12 bg-white rounded-full p-1 shadow-lg relative z-10">
             
             {/* --- AVATAR LOGIC START --- */}
             <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                {user.photoURL && !imageError ? (
                    // 1. Valid Photo URL
                    <img 
                        src={user.photoURL} 
                        alt="User" 
                        className="w-full h-full object-cover" 
                        onError={() => setImageError(true)} // If load fails, switch to fallback
                    />
                ) : user.displayName ? (
                    // 2. No Photo (or broken), but has Name -> Show Initials
                    <div className="w-full h-full bg-slate-700 text-white flex items-center justify-center text-3xl font-bold select-none">
                        {user.displayName[0].toUpperCase()}
                    </div>
                ) : (
                    // 3. No Photo, No Name -> Show Default Silhouette Icon
                    <div className="w-full h-full bg-slate-200 text-slate-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 mt-2">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
             </div>
             {/* --- AVATAR LOGIC END --- */}

          </div>
          
          <h2 className="mt-3 text-2xl font-bold text-slate-800">
            {user.displayName || 'Guest User'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">{user.email}</p>

          {/* TOP STATS ROW */}
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Games</div>
                <div className="text-3xl font-black text-slate-700">{stats.totalGames}</div>
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Avg Accuracy</div>
                <div className={`text-3xl font-black ${stats.averageAccuracy > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {stats.averageAccuracy}%
                </div>
             </div>
          </div>
        </div>

        {/* SCROLLABLE HISTORY LIST */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 bg-white border-t border-slate-100">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider my-4 sticky top-0 bg-white py-2 z-10">
                Recent Activity
             </h3>

             {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
                </div>
             ) : sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
                   No games played yet. Go play some music!
                </div>
             ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div key={session.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors group">
                            <div className="flex items-center gap-4">
                                {/* Game Icon */}
                                <div className={`
                                    w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md group-hover:scale-110 transition-transform
                                    ${session.game === 'Drums' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 
                                      session.game === 'Piano' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 
                                      'bg-gradient-to-br from-amber-400 to-amber-600'}
                                `}>
                                    {session.game[0]}
                                </div>
                                
                                {/* Game Details */}
                                <div>
                                    <div className="font-bold text-slate-700 text-lg">{session.game}</div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                          ⏱ {formatTime(session.timeSpentSeconds)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex gap-2 mt-1.5 font-medium">
                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Hit: {session.hits}</span>
                                        <span className="text-red-400 bg-red-50 px-2 py-0.5 rounded">Miss: {session.misses}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Score & Date */}
                            <div className="text-right">
                                <div className={`font-bold text-xl ${session.accuracy >= 80 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                    {session.accuracy}%
                                </div>
                                <div className="text-xs text-slate-400 font-medium mt-1">
                                    {session.timestamp?.toDate ? session.timestamp.toDate().toLocaleDateString() : 'Just now'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
        
      </div>
    </div>
  );
};

export default ProfilePage;