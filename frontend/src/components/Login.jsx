import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Key, User, Github, Globe } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await axios.post('/api/auth/register', { username, password });
        // Auto-login after successful registration
        setIsRegister(false);
        const res = await axios.post('/api/auth/login', { username, password });
        onLoginSuccess(res.data);
      } else {
        // Login flow
        const res = await axios.post('/api/auth/login', { username, password });
        onLoginSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Authentication request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || sessionStorage.getItem('google_client_id');
    if (!clientId) {
      const enteredId = prompt(
        "Google OAuth requires a Google Client ID from Google Cloud Console.\n\n" +
        "Please enter your Google Client ID to connect (or configure VITE_GOOGLE_CLIENT_ID in your environment):",
        ""
      );
      if (!enteredId) return;
      clientId = enteredId.trim();
      sessionStorage.setItem('google_client_id', clientId);
    }
    
    const redirectUri = `${window.location.origin}/oauth/callback/google`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent("openid profile email")}`;
      
    window.location.href = authUrl;
  };

  const handleOAuthPlaceholder = (provider) => {
    alert(`OAuth redirection mock for ${provider}. Register/Login with username & password to proceed.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-zinc-800 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            {isRegister ? "Create Developer Account" : "Access Quant Analytics Terminal"}
          </h2>
          <p className="text-xs text-zinc-500">
            {isRegister ? "Join the high-speed data stream correlation engine" : "Authorized trading personnel credentials required"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="developer_trader"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Authenticating..." : (isRegister ? "Sign Up" : "Secure Log In")}
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 w-full border-t border-zinc-900"></div>
          <span className="relative px-3 bg-zinc-950 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Or Federated OAuth</span>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthPlaceholder('GitHub')}
            className="py-2 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-850 hover:border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Github className="h-4 w-4" />
            GitHub
          </button>
          <button
            onClick={handleGoogleLogin}
            className="py-2 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-850 hover:border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Google
          </button>
        </div>

        {/* Toggle option */}
        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-zinc-500 hover:text-blue-400 transition-colors"
          >
            {isRegister ? "Already have account? Sign in" : "New analyst? Register profile here"}
          </button>
        </div>

      </div>
    </div>
  );
}
