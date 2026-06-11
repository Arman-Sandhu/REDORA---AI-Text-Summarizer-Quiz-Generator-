import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, Sparkles, ArrowRight, User } from 'lucide-react';
import { PageWrapper } from '../components/ui/PageWrapper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { springs } from '../lib/motion';

export default function AuthScreen() {
  const { login, register, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  return (
    <PageWrapper className="flex flex-col items-center justify-center min-h-[75vh] relative overflow-visible">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-accent-violet/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Fluid Morph Card */}
        <motion.div 
          layout
          transition={springs.medium}
          className="overflow-hidden w-full"
        >
          <Card className="p-8 w-full shadow-2xl flex flex-col relative bg-[#0a0a0a] border border-white/[0.04]" interactive={false}>
            
            {/* Staggered Header Items */}
            <motion.div layout className="text-center mb-8 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#111] border border-white/[0.04] text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-5 select-none">
                <Sparkles size={10} className="text-accent-violet animate-pulse" />
                <span>{isLogin ? 'Welcome Back' : 'Get Started'}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-white select-none">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/10 text-red-400 p-3 rounded-xl mb-6 text-center text-xs font-mono font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-wider select-none">Full Name</label>
                  <Input 
                    type="text"
                    icon={User}
                    placeholder="Your Name"
                    required={!isLogin}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-wider select-none">Email Address</label>
                <Input 
                  type="email"
                  icon={Mail}
                  placeholder="name@domain.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-wider select-none">Password</label>
                <Input 
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                isLoading={loading}
                variant="primary"
                className="w-full py-3.5 rounded-xl mt-3 text-sm group font-semibold"
              >
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-black transition-colors ml-1" />
              </Button>
            </form>

            {/* Social Section */}
            <motion.div layout className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.03]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-[#0a0a0a] px-3 text-zinc-600 font-mono font-semibold">Or continue with</span>
              </div>
            </motion.div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              variant="secondary"
              magnetic
              className="w-full flex items-center justify-center gap-3.5 rounded-xl border border-white/[0.03] py-3 px-4 transition-all text-xs tracking-tight text-zinc-300 font-semibold"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign In with Google</span>
            </Button>

            {/* Toggle Switch */}
            <motion.div layout className="mt-8 text-center">
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-zinc-500 hover:text-white transition-colors text-xs font-medium tracking-tight outline-none select-none"
              >
                {isLogin ? "New to Redora? " : "Already have an account? "}
                <span className="text-accent-blue hover:underline ml-1">{isLogin ? 'Create an Account' : 'Sign In Now'}</span>
              </button>
            </motion.div>
          </Card>
        </motion.div>

        {/* Anonymous Link */}
        <motion.div 
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-6"
        >
          <button 
            onClick={() => navigate('/input')}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs font-mono flex items-center justify-center gap-2 mx-auto bg-white/[0.02] hover:bg-white/[0.05] py-2 px-4 rounded-xl border border-white/[0.02]"
          >
            Access as Guest
          </button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
