import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import api from '../api/axiosClient';
import SkillCard from '../components/SkillCard';
import RequestSwapModal from '../components/RequestSwapModal';
import { useAuth } from '../context/AuthContext';

const BrowseSkills = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const type = searchParams.get('type') || 'offered';
  const proficiency = searchParams.get('proficiency') || 'All';

  // Local state for instant input
  const [keywordInput, setKeywordInput] = useState(search);

  // Modal state
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setKeywordInput(search);
  }, [search]);

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      if (type && type !== 'all') params.append('type', type);
      if (proficiency && proficiency !== 'All') params.append('proficiency', proficiency);

      const res = await api.get(`/skills?${params.toString()}`);
      setSkills(res.data || []);
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skills list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();

    const handleUpdate = () => {
      fetchSkills();
    };
    window.addEventListener('skillswap:profile-updated', handleUpdate);
    return () => window.removeEventListener('skillswap:profile-updated', handleUpdate);
  }, [searchParams]);

  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'All' || (key === 'type' && val === 'all')) {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: keywordInput.trim() });
  };

  const resetFilters = () => {
    setKeywordInput('');
    setSearchParams({});
  };

  const handleOpenSwap = (skill) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const categories = [
    'All',
    'Programming',
    'Design',
    'Languages',
    'Data & Analytics',
    'Music & Arts',
    'Marketing',
    'Business'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Browse Skills Directory</h1>
        <p className="text-xs font-medium text-stone-500 mt-0.5">
          Search offered and wanted skills across all public community profiles
        </p>
      </div>

      {/* Neomorphic Search & Filter Controls */}
      <div className="neo-card p-5 space-y-4">
        {/* Search input bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
          <div className="relative flex-1 flex items-center neo-inset rounded-xl px-3 py-1">
            <Search className="w-4 h-4 text-stone-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Search by keyword (e.g. Photoshop, Excel, React, Spanish)..."
              className="w-full py-2 text-xs text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 neo-btn-primary text-xs font-bold rounded-xl flex-shrink-0"
          >
            Search
          </button>
          {(search || category !== 'All' || proficiency !== 'All' || type !== 'offered') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3.5 py-2.5 neo-btn text-xs font-semibold rounded-xl flex items-center gap-1.5 flex-shrink-0 text-stone-600"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </form>

        {/* Filter Rows */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0ECC7] text-xs">
          {/* Type Toggle: Offered vs Wanted */}
          <div className="flex items-center gap-1.5 neo-inset p-1 rounded-xl">
            <button
              type="button"
              onClick={() => updateFilters({ type: 'offered' })}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                type === 'offered'
                  ? 'neo-btn text-[#E05504] font-extrabold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Skills Offered
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ type: 'wanted' })}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                type === 'wanted'
                  ? 'neo-btn text-[#FAA121] font-extrabold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Skills Wanted
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ type: 'all' })}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                type === 'all'
                  ? 'neo-btn text-stone-900 font-extrabold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-semibold text-xs">Category:</span>
            <select
              value={category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="px-3 py-1.5 neo-card-sm text-xs font-semibold text-stone-700 bg-[#FEF8E0] focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Proficiency Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-semibold text-xs">Proficiency:</span>
            <select
              value={proficiency}
              onChange={(e) => updateFilters({ proficiency: e.target.value })}
              className="px-3 py-1.5 neo-card-sm text-xs font-semibold text-stone-700 bg-[#FEF8E0] focus:outline-none"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Result Count */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
        <span>Showing {skills.length} {type === 'offered' ? 'skills offered' : type === 'wanted' ? 'skills wanted' : 'skills'}</span>
        {search && <span className="neo-card-sm px-2.5 py-1">Filtered by: "{search}"</span>}
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="neo-card p-6 h-56 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : skills.length === 0 ? (
        <div className="neo-card p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No skills found matching your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
            Try adjusting your search query or reset the filters to see all available community skills.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 neo-btn text-xs font-bold rounded-xl"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onRequestSwap={handleOpenSwap}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <RequestSwapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetSkill={selectedSkill}
        onSuccess={() => {
          navigate('/swaps');
        }}
      />
    </div>
  );
};

export default BrowseSkills;
