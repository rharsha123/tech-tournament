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
      onSuccess();
    } catch (err) {
      setError("Failed to sign in. Please verify your credentials.");
    }
  };

  return (
    <div className="bg-snb-bg min-h-screen pt-20">
      <div className="max-w-md mx-auto bg-white p-10 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-snb-green p-4 rounded-xl text-snb-accent mb-3">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-snb-dark">Admin Control Access</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage the sports portal</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm font-semibold border border-red-200 text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-snb-dark">Authorized Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full mt-1.5 p-3 border rounded-xl focus:ring-2 focus:ring-snb-accent outline-none bg-slate-50 border-slate-300" 
              placeholder="admin@tech-tournaments.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-snb-dark">Secure Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full mt-1.5 p-3 border rounded-xl focus:ring-2 focus:ring-snb-accent outline-none bg-slate-50 border-slate-300" 
              placeholder="••••••••••"
              required 
            />
          </div>
          <button type="submit" className="w-full bg-snb-dark hover:bg-snb-green text-snb-accent py-3.5 rounded-xl font-extrabold transition shadow-md">
            Sign In to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
