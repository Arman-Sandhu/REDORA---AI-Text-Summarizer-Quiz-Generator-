import React, { useEffect, useContext, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function GoogleCallbackScreen() {
  const [searchParams] = useSearchParams();
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code found in the URL. Please try logging in again.');
        return;
      }

      try {
        const redirectUri = window.location.origin + '/auth/google/callback';
        await googleLogin(code, redirectUri);
        navigate('/dashboard');
      } catch (err) {
        console.error('Google login error:', err);
        setError(err.response?.data?.detail || 'Authentication failed during Google callback.');
      }
    };

    handleCallback();
  }, [searchParams, googleLogin, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="w-full max-w-md p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] text-center">
        {error ? (
          <div className="space-y-4 animate-fade-in">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold font-orbitron text-white">Authentication Failed</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
            <button 
              onClick={() => navigate('/auth')}
              className="btn-secondary w-full py-3.5 mt-4"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-accent-cyan/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
              <Sparkles size={20} className="text-accent-cyan animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-orbitron text-white tracking-wide">Authenticating</h2>
              <p className="text-gray-500 text-sm mt-2 font-medium">Exchanging Google credentials...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
