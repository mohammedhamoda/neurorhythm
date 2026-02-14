import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

// --- Types ---
interface Session {
  id: string;
  userId: string;
  userName: string;
  game: string;
  accuracy: number;
  hits: number;
  misses: number;
  timestamp: any;
  // NEW: Added time tracking fields (optional as old data might not have them)
  timeSpentSeconds?: number;
  intendedDurationMinutes?: number;
}

interface UserSummary {
  userId: string;
  userName: string;
  role: string;
  email: string;
  totalGames: number;
  averageAccuracy: number;
  lastPlayed: any;
  sessions: Session[]; 
}

const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [groupedUsers, setGroupedUsers] = useState<Record<string, UserSummary[]>>({});
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Helper to format seconds into "4m 12s"
  const formatTime = (seconds?: number) => {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const toggleGroup = (role: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userMap = new Map<string, UserSummary>();

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          userMap.set(doc.id, {
            userId: doc.id,
            userName: data.displayName || data.email || "Unknown",
            email: data.email,
            role: data.role || "Uncategorized", 
            totalGames: 0,
            averageAccuracy: 0,
            lastPlayed: null,
            sessions: []
          });
        });

        // 2. Fetch Sessions
        const q = query(collection(db, "sessions"), orderBy("timestamp", "desc"));
        const sessionsSnapshot = await getDocs(q);

        sessionsSnapshot.forEach(doc => {
          const session = doc.data() as Session;
          if (!userMap.has(session.userId)) {
             userMap.set(session.userId, {
               userId: session.userId,
               userName: session.userName || "Anonymous",
               email: "N/A",
               role: "Uncategorized",
               totalGames: 0,
               averageAccuracy: 0,
               lastPlayed: null,
               sessions: []
             });
          }
          const user = userMap.get(session.userId)!;
          user.sessions.push({ ...session, id: doc.id });
          user.totalGames += 1;
          if (!user.lastPlayed) user.lastPlayed = session.timestamp;
        });

        // 3. Group by Role
        const groups: Record<string, UserSummary[]> = {};
        userMap.forEach(user => {
          if (user.totalGames > 0) {
            const totalAcc = user.sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0);
            user.averageAccuracy = Math.round(totalAcc / user.totalGames);
          }
          user.sessions.sort((a, b) => b.timestamp - a.timestamp);

          const roleKey = user.role;
          if (!groups[roleKey]) groups[roleKey] = [];
          groups[roleKey].push(user);
        });

        setGroupedUsers(groups);
        setLoading(false);

      } catch (error: any) {
        console.error("Fetch error:", error);
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
          setAccessDenied(true);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-10 text-center animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-sm">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600/80 mb-6">You need Admin permissions to view user data.</p>
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition">
          <span>←</span> Back to Game
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Categorized User List */}
        <div className="md:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-[80vh] flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h2 className="font-bold text-slate-700">Patient Groups</h2>
          </div>
          
          <div className="overflow-y-auto flex-1 bg-white">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading records...</div>
            ) : Object.keys(groupedUsers).length === 0 ? (
               <div className="p-8 text-center text-slate-400">No users found.</div>
            ) : (
              Object.keys(groupedUsers).map(role => {
                const isExpanded = !!expandedGroups[role];
                const userCount = groupedUsers[role].length;

                return (
                  <div key={role} className="border-b border-slate-100 last:border-0">
                    <button 
                      onClick={() => toggleGroup(role)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full shadow-sm
                          ${role === 'Schizophrenia' ? 'bg-emerald-400' : 
                            role === 'Depression' ? 'bg-blue-400' : 
                            role === 'Anxiety' ? 'bg-purple-400' : 'bg-slate-300'}`}>
                        </span>
                        <span className="font-bold text-slate-700 text-sm">{role}</span>
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-white transition-colors">
                          {userCount}
                        </span>
                      </div>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" height="16" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="bg-slate-50/50 p-2 space-y-1 animate-fade-in shadow-inner">
                        {groupedUsers[role].map(user => (
                          <button
                            key={user.userId}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 group
                              ${selectedUser?.userId === user.userId 
                                ? 'bg-white border border-slate-200 shadow-md ring-1 ring-slate-100' 
                                : 'hover:bg-white hover:shadow-sm border border-transparent'}
                            `}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                               ${selectedUser?.userId === user.userId ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}
                            `}>
                              {user.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-sm truncate text-slate-700">{user.userName}</div>
                              <div className="text-[10px] text-slate-400 flex gap-2">
                                 <span>{user.totalGames} Games</span>
                                 {user.averageAccuracy > 0 && <span>• {user.averageAccuracy}% Avg</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected User Details */}
        <div className="md:col-span-8">
          {selectedUser ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-[80vh] overflow-hidden flex flex-col animate-fade-in">
              <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-100">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2
                      ${selectedUser.role === 'Schizophrenia' ? 'bg-emerald-100 text-emerald-700' : 
                        selectedUser.role === 'Depression' ? 'bg-blue-100 text-blue-700' : 
                        selectedUser.role === 'Anxiety' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}
                  `}>
                    {selectedUser.role} Category
                  </span>
                  <h2 className="text-3xl font-bold text-slate-800">{selectedUser.userName}</h2>
                  <p className="text-sm text-slate-400 mt-1">{selectedUser.email}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Performance</div>
                    <div className={`text-4xl font-black ${selectedUser.averageAccuracy > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {selectedUser.averageAccuracy}%
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h3>
                {selectedUser.sessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">No games played yet.</div>
                ) : (
                    <div className="space-y-3">
                    {selectedUser.sessions.map((session) => (
                        <div key={session.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md group-hover:scale-110 transition-transform
                            ${session.game === 'Drums' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 
                                session.game === 'Piano' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 
                                'bg-gradient-to-br from-amber-400 to-amber-600'}
                            `}>
                            {session.game[0]}
                            </div>
                            <div>
                                <div className="font-bold text-slate-700 text-lg flex items-center gap-2">
                                  {session.game}
                                </div>
                                
                                {/* NEW: Time Played vs Intended Time */}
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                  <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 rounded">
                                    Played: {formatTime(session.timeSpentSeconds)}
                                  </span>
                                  <span className="text-slate-300">/</span>
                                  <span className="text-slate-400">
                                    Goal: {session.intendedDurationMinutes || '?'}m
                                  </span>
                                </div>

                                <div className="text-xs text-slate-400 flex gap-2 mt-1.5 font-medium">
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Hit: {session.hits}</span>
                                    <span className="text-red-400 bg-red-50 px-2 py-0.5 rounded">Miss: {session.misses}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-700 text-xl">{session.accuracy}%</div>
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
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="text-6xl mb-6 opacity-30 grayscale">👈</div>
              <p className="text-lg font-medium">Select a patient group to expand, then select a user.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;