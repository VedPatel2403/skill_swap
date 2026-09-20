import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Lock, Mail, User, MapPin, Clock, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const isAddAccountMode = searchParams.get('mode') === 'add_account';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    availability: 'Weekends & Evenings',
    bio: '',
    isPublic: true
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/profile');
    } catch (err) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in popup was closed before completing.');
      } else if (err.code === 'auth/internal-error') {
        setError('Google popup encountered an error. Please ensure popups and third-party cookies are allowed for localhost, or enter your credentials below.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Firebase domain authorization required for Google login on this URL. Please add 'vedpatel2403.github.io' in Firebase Console > Authentication > Settings > Authorized Domains, or register with email below!");
      } else {
        setError(err.response?.data?.error || err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl neo-btn-primary flex items-center justify-center mx-auto text-white">
          <ArrowLeftRight className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Create Your Account</h1>
        <p className="text-xs font-medium text-stone-500">
          Join the SkillSwap community to share your talents and learn new skills
        </p>
      </div>

      <div className="neo-card p-6 sm:p-8 space-y-4">
        {isAddAccountMode && (
          <div className="p-3 bg-[#F0ECC7]/70 border border-[#F0ECC7] rounded-xl text-stone-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
            <div className="w-8 h-8 rounded-lg bg-[#FEF8E0] text-[#E05504] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="font-bold block text-stone-900">Add Another Account to this Device</span>
              <span className="text-[11px] text-stone-600">
                Registering a new account will add it to your Switch Account list so you can switch anytime.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 neo-btn rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold text-stone-700 hover:text-stone-900 transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#F0ECC7] w-full"></div>
          <span className="bg-[#FEF8E0] px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 absolute">
            or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name:
            </label>
            <div className="flex items-center neo-inset rounded-xl px-3 py-1">
              <User className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maya Lin"
                className="w-full py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address:
            </label>
            <div className="flex items-center neo-inset rounded-xl px-3 py-1">
              <Mail className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password:
            </label>
            <div className="flex items-center neo-inset rounded-xl px-3 py-1">
              <Lock className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Location (Optional):
            </label>
            <div className="flex items-center neo-inset rounded-xl px-3 py-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Toronto, Canada or Remote"
                className="w-full py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              General Availability:
            </label>
            <div className="flex items-center neo-inset rounded-xl px-3 py-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="e.g. Weekends, Weekday Evenings"
                className="w-full py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 neo-btn-primary text-xs font-bold rounded-xl flex items-center justify-center"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="pt-4 border-t border-[#F0ECC7] text-center text-xs text-stone-500 font-medium">
          Already have an account?{' '}
          <Link
            to={isAddAccountMode ? "/login?mode=add_account" : "/login"}
            className="font-bold text-[#E05504] hover:text-[#c2410c]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
