import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Star,
  ArrowLeftRight,
  Shield,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import api from '../api/axiosClient';
import StatusBadge from '../components/StatusBadge';
import RequestSwapModal from '../components/RequestSwapModal';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTargetSkill, setSelectedTargetSkill] = useState(null);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/users/${id}`);
        setProfile(res.data);
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.isPrivate) {
          setIsPrivate(true);
          setProfile(err.response.data.user);
        } else {
          setError(err.response?.data?.error || 'Failed to load user profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleOpenSwap = (skill = null) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedTargetSkill(skill);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="neo-card p-8 animate-pulse space-y-6">
          <div className="w-20 h-20 bg-slate-300/60 rounded-2xl" />
          <div className="h-6 w-48 bg-slate-300/60 rounded" />
          <div className="h-4 w-96 bg-slate-300/60 rounded" />
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4 neo-card p-8">
        <div className="w-16 h-16 rounded-2xl neo-inset flex items-center justify-center mx-auto text-slate-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Private Profile</h2>
        <p className="text-xs text-slate-500 font-medium">
          This user has set their profile to private. Their skill lists and availability are hidden from the public directory.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 px-4 py-2 neo-btn text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Browse Skills</span>
        </Link>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4 neo-card p-8">
        <h2 className="text-xl font-black text-rose-600">User Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">{error || 'This user does not exist or has been removed.'}</p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 px-4 py-2 neo-btn text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 neo-btn px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Browse Skills</span>
      </Link>

      {/* Profile Header Card */}
      <div className="neo-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
                <StatusBadge status={profile.isPublic ? 'public' : 'private'} />
                {profile.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-[#FAA121]/30 text-[#78350f] text-xs font-bold rounded-lg">
                    Admin
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {profile.availability || 'Flexible availability'}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          {!isOwnProfile ? (
            <button
              onClick={() => handleOpenSwap()}
              className="w-full sm:w-auto px-6 py-3 neo-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Propose Skill Swap</span>
            </button>
          ) : (
            <Link
              to="/profile"
              className="w-full sm:w-auto px-5 py-2.5 neo-btn text-xs font-bold rounded-xl text-center text-stone-700"
            >
              Edit Your Profile
            </Link>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-[#F0ECC7]">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-stone-700 leading-relaxed max-w-3xl font-normal">{profile.bio}</p>
          </div>
        )}

        {/* Summary Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#F0ECC7] text-center">
          <div className="neo-inset p-3.5 rounded-2xl">
            <span className="text-xs text-stone-400 block mb-0.5 font-bold">Average Rating</span>
            <div className="flex items-center justify-center gap-1 font-black text-stone-900 text-base">
              <Star className="w-4 h-4 fill-[#FAA121] text-[#FAA121]" />
              <span>{profile.averageRating > 0 ? profile.averageRating : 'N/A'}</span>
            </div>
          </div>

          <div className="neo-inset p-3.5 rounded-2xl">
            <span className="text-xs text-stone-400 block mb-0.5 font-bold">Reviews Received</span>
            <span className="font-black text-stone-900 text-base">{profile.ratingCount || 0}</span>
          </div>

          <div className="neo-inset p-3.5 rounded-2xl">
            <span className="text-xs text-stone-400 block mb-0.5 font-bold">Completed Swaps</span>
            <span className="font-black text-stone-900 text-base">{profile.completedSwapsCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Two-Column Skills Offered & Wanted Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Offered */}
        <div className="neo-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECC7]">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E05504]"></span>
              Skills Offered
            </h2>
            <span className="text-xs text-stone-400 font-bold">
              {profile.skillsOffered?.length || 0} listed
            </span>
          </div>

          {profile.skillsOffered?.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center font-medium">No skills currently offered.</p>
          ) : (
            <div className="space-y-3">
              {profile.skillsOffered.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 rounded-xl neo-card-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-bold text-stone-900">{skill.title}</h4>
                      <span className="text-[11px] font-bold text-[#166534] bg-[#AFDFB5]/40 px-2 py-0.5 rounded-md border border-[#AFDFB5]">
                        {skill.proficiency}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-stone-400 block mb-2">
                      Category: {skill.category}
                    </span>
                    <p className="text-xs text-stone-600 leading-relaxed font-normal">{skill.description}</p>
                  </div>

                  {!isOwnProfile && (
                    <div className="pt-2 border-t border-[#F0ECC7] flex justify-end">
                      <button
                        onClick={() => handleOpenSwap(skill)}
                        className="text-xs font-bold text-[#E05504] hover:text-[#c2410c] neo-btn px-3 py-1 rounded-lg"
                      >
                        Request This Skill &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Wanted */}
        <div className="neo-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Skills Wanted
            </h2>
            <span className="text-xs text-slate-400 font-bold">
              {profile.skillsWanted?.length || 0} wanted
            </span>
          </div>

          {profile.skillsWanted?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-medium">No wanted skills listed yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.skillsWanted.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 rounded-xl neo-card-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-slate-900">{skill.title}</h4>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Target: {skill.proficiency}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                    Category: {skill.category}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{skill.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Community Reviews / Testimonials Section */}
      <div className="neo-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div>
            <h2 className="text-base font-black text-slate-900">Community Feedback & Reviews</h2>
            <p className="text-xs font-medium text-slate-500">Ratings verified from completed skill swaps</p>
          </div>
          <span className="text-xs font-bold text-slate-700 neo-card-sm px-2.5 py-1">
            {profile.reviews?.length || 0} Reviews
          </span>
        </div>

        {profile.reviews?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            No reviews yet. Complete a skill swap with {profile.name} to leave the first review!
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {profile.reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-xl neo-card-sm space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={review.rater?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.rater?.name}`}
                      alt={review.rater?.name}
                      className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {review.rater?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.score
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic pl-10 font-normal">
                  "{review.feedback}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <RequestSwapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetSkill={selectedTargetSkill}
        targetUser={profile}
        onSuccess={() => {
          navigate('/swaps');
        }}
      />
    </div>
  );
};

export default UserProfile;
