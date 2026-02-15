// @ts-nocheck
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getBrainState, ROLE_GENERAL_NOTES } from './brainZonesData';

interface Session {
  id: string;
  userId: string;
  userName: string;
  game: string;
  accuracy: number;
  hits: number;
  misses: number;
  timestamp: any;
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
  
  // NEW: State to track which session is currently clicked for the popup
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

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

  // --- Render Helpers ---
  let selectedUserBrainState = null;
  let selectedUserGeneralNote = "";
  
  if (selectedUser) {
    selectedUserBrainState = getBrainState(selectedUser.role, selectedUser.averageAccuracy);
    // @ts-ignore 
    selectedUserGeneralNote = ROLE_GENERAL_NOTES[selectedUser.role] || "";
  }

  // Helper to get brain state for the POPUP (single session)
  const getSessionBrainState = () => {
    if (!selectedUser || !selectedSession) return null;
    return getBrainState(selectedUser.role, selectedSession.accuracy);
  };

  const sessionPopupState = getSessionBrainState();

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans relative">
      
      {/* --- SESSION DETAIL MODAL --- */}
      {selectedSession && sessionPopupState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm
                    ${selectedSession.game === 'Drums' ? 'bg-indigo-500' : 
                      selectedSession.game === 'Piano' ? 'bg-pink-500' : 
                      'bg-amber-500'}
                  `}>
                  {selectedSession.game[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{selectedSession.game} Analysis</h3>
                    <p className="text-xs text-slate-400">
                      {selectedSession.timestamp?.toDate ? selectedSession.timestamp.toDate().toLocaleString() : 'Just now'}
                    </p>
                  </div>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              
              {/* Accuracy Display */}
              <div className="flex justify-between items-end mb-6">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Session Accuracy</div>
                <div className={`text-5xl font-black ${selectedSession.accuracy > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedSession.accuracy}%
                </div>
              </div>

              {/* THE BRAIN ZONE CARD (Reused Styling) */}
              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm ring-4 ring-slate-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🧠</span>
                    <h3 className="text-slate-800 font-bold text-lg">{sessionPopupState.state}</h3>
                  </div>
                  
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {sessionPopupState.interpretation}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {sessionPopupState.features.map((feature: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 text-xs rounded-md font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                   <div className="text-xs text-slate-400 font-bold uppercase mb-1">Time</div>
                   <div className="font-bold text-slate-700">{formatTime(selectedSession.timeSpentSeconds)}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                   <div className="text-xs text-emerald-400 font-bold uppercase mb-1">Hits</div>
                   <div className="font-bold text-emerald-700">{selectedSession.hits}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                   <div className="text-xs text-red-400 font-bold uppercase mb-1">Misses</div>
                   <div className="font-bold text-red-700">{selectedSession.misses}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MAIN DASHBOARD CONTENT --- */}

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
                        {groupedUsers[role].map(user => {
                            const userState = getBrainState(user.role, user.averageAccuracy);
                            
                            return (
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
                                  <div className="text-[10px] text-slate-400 flex flex-col">
                                     <span>{user.totalGames} Games • {user.averageAccuracy}%</span>
                                     {user.averageAccuracy > 0 && (
                                       <span className="text-slate-500 font-medium truncate mt-0.5">{userState.state}</span>
                                     )}
                                  </div>
                                </div>
                              </button>
                            );
                        })}
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
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
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
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Avg Accuracy</div>
                    <div className={`text-4xl font-black ${selectedUser.averageAccuracy > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {selectedUser.averageAccuracy}%
                  </div>
                </div>
              </div>

              {/* OVERALL MIND STATE ANALYSIS BLOCK */}
              {selectedUserBrainState && selectedUser.totalGames > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🧠</span>
                    <h3 className="text-slate-800 font-bold text-lg">{selectedUserBrainState.state}</h3>
                  </div>
                  
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {selectedUserBrainState.interpretation}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedUserBrainState.features.map((feature: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 text-xs rounded-md font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>

                  {selectedUserGeneralNote && (
                    <div className="text-xs text-slate-400 italic border-t border-slate-100 pt-3 mt-1">
                      Note: {selectedUserGeneralNote}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Session History</h3>
                {selectedUser.sessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">No games played yet.</div>
                ) : (
                    <div className="space-y-3">
                    {selectedUser.sessions.map((session) => (
                        <button 
                          key={session.id} 
                          onClick={() => setSelectedSession(session)}
                          className="w-full flex justify-between items-center p-4 hover:bg-slate-50 hover:scale-[1.01] active:scale-95 rounded-2xl border border-slate-100 transition-all group text-left relative"
                        >
                            <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-bold transition-opacity">
                                CLICK TO VIEW ANALYSIS ↗
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`
                                w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md group-hover:shadow-lg transition-all
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
                        </button>
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