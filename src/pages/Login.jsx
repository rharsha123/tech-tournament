import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { LogIn } from "lucide-react";

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Failed to sign in. Please verify your credentials.");
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen px-4 pt-12 sm:pt-20 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-600 p-4 rounded-xl text-white mb-3 shadow-md">
            <LogIn className="w-8 h-8" />
          <h2 className="text-2xl font-black text-slate-900">Admin Control Access</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage the sports portal</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm font-semibold border border-red-200 text-center">
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Authorized Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full mt-1.5 p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 border-slate-300 text-slate-800" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Secure Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full mt-1.5 p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 border-slate-300 text-slate-800" 
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
          >
            Sign In to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
