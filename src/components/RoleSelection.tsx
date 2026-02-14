import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { type User } from 'firebase/auth';

interface RoleSelectionProps {
  user: User;
  onRoleSet: (role: string) => void;
}

const RoleSelection = ({ user, onRoleSet }: RoleSelectionProps) => {

  const handleSelectRole = async (role: string) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName, // Helpful to save this too
        role: role,
        createdAt: new Date()
      }, { merge: true });

      onRoleSet(role);
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Failed to save role. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50">
      
      {/* --- LIQUID BACKGROUND EFFECTS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300/30 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-pulse delay-1000" />
      <div className="absolute top-[40%] left-[40%] w-72 h-72 bg-blue-300/30 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-pulse delay-2000" />


      <div className="relative z-10 max-w-md w-full text-center space-y-8 p-6">
        <div>
          <h2 className="text-4xl font-light text-slate-700 tracking-tight">
            Welcome, <span className="font-semibold text-slate-800">{user.displayName}</span>
          </h2>
          <p className="mt-3 text-slate-500 font-medium tracking-wide">Select your suitable path</p>
        </div>

        <div className="grid gap-5">
          {/* OPTION 1: SCHIZOPHRENIA */}
          <button 
            onClick={() => handleSelectRole('Schizophrenia')}
            className="group relative p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/50 text-left overflow-hidden"
          >
             {/* Subtle shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Schizophrenia</h3>
          </button>

          {/* OPTION 2: DEPRESSION */}
          <button 
            onClick={() => handleSelectRole('Autism Spectrum Disorder')}
            className="group relative p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/50 text-left overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Depression</h3>
          </button>
          <button 
            onClick={() => handleSelectRole('Depression')}
            className="group relative p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/50 text-left overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Anxiety</h3>
          </button>
          <button 
            onClick={() => handleSelectRole('ADHD')}
            className="group relative p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/50 text-left overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Anxiety</h3>
          </button>
          <button 
            onClick={() => handleSelectRole('Anxiety')}
            className="group relative p-6 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/50 text-left overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Anxiety</h3>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;