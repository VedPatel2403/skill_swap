import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeftRight, Sparkles, CheckCircle, Star, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../api/axiosClient';
import SkillCard from '../components/SkillCard';
import RequestSwapModal from '../components/RequestSwapModal';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSkills, setFeaturedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkillForSwap, setSelectedSkillForSwap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/skills?type=offered');
        setFeaturedSkills((res.data || []).slice(0, 6));
      } catch (err) {
        console.error('Failed to load featured skills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();

    const handleUpdate = () => fetchFeatured();
    window.addEventListener('skillswap:profile-updated', handleUpdate);
    return () => window.removeEventListener('skillswap:profile-updated', handleUpdate);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const handleOpenSwap = (skill) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedSkillForSwap(skill);
    setIsModalOpen(true);
  };

  const categories = [
    { name: 'Programming', count: '12+ Skills' },
    { name: 'Design', count: '8+ Skills' },
    { name: 'Languages', count: '6+ Skills' },
    { name: 'Data & Analytics', count: '5+ Skills' },
    { name: 'Music & Arts', count: '4+ Skills' },
    { name: 'Marketing', count: '7+ Skills' },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neo-card-sm text-[#E05504] text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#FAA121]" />
          <span>Next-Generation Peer Skill Exchange</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-tight mb-4">
          Trade What You Know. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#E05504] via-[#FAA121] to-[#E05504] bg-clip-text text-transparent">
            Learn What You Don't.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          A sleek, modern soft-UI platform to barter expertise. Teach React in exchange for Spanish, or trade Excel modeling for UI design—completely free of charge.
        </p>

        {/* Neomorphic Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="max-w-2xl mx-auto flex items-center neo-card p-2 gap-2"
        >
          <div className="flex-1 flex items-center neo-inset rounded-xl px-3 py-1">
            <Search className="w-4 h-4 text-stone-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills by keyword (e.g. Photoshop, Excel, Python, Guitar)..."
              className="w-full py-2 text-xs text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 neo-btn-primary text-xs font-bold rounded-xl flex-shrink-0 flex items-center gap-1.5"
          >
            <span>Search Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Popular Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">Trending:</span>
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => navigate(`/browse?category=${encodeURIComponent(c.name)}`)}
              className="px-3.5 py-1.5 neo-btn rounded-full text-xs font-semibold text-stone-700 hover:text-[#E05504]"
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Value Pillars / How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">How Skill Swap Works</h2>
          <p className="text-xs font-medium text-stone-500 mt-1">Three intuitive steps to start bartering expertise</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neo-card p-7 text-left space-y-3">
            <div className="w-12 h-12 rounded-2xl neo-inset text-[#E05504] flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-stone-900">Build Your Skill Lists</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              List what you offer and what you want, configure your availability schedule, and toggle your profile visibility.
            </p>
          </div>

          <div className="neo-card p-7 text-left space-y-3">
            <div className="w-12 h-12 rounded-2xl neo-inset text-[#166534] bg-[#AFDFB5]/20 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-stone-900">Propose & Accept Swaps</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Discover verified community members, propose mutually beneficial swaps, manage pending offers, and collaborate.
            </p>
          </div>

          <div className="neo-card p-7 text-left space-y-3">
            <div className="w-12 h-12 rounded-2xl neo-inset text-[#78350f] bg-[#FAA121]/20 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-stone-900">Complete & Share Feedback</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Once sessions are completed, leave verified star ratings and detailed feedback to establish reputation in the network.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Skills Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Available Skills to Learn</h2>
            <p className="text-xs font-medium text-stone-500">Skills actively offered by community members</p>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E05504] neo-btn px-3 py-1.5 rounded-xl"
          >
            <span>View All Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="neo-card p-6 h-52 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onRequestSwap={handleOpenSwap}
              />
            ))}
          </div>
        )}
      </section>

      {/* Request Swap Modal */}
      <RequestSwapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetSkill={selectedSkillForSwap}
        onSuccess={() => {
          navigate('/swaps');
        }}
      />
    </div>
  );
};

export default Home;
