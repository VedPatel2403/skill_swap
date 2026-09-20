import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Camera,
  MapPin,
  Clock,
  BookOpen,
  Upload,
  Sparkles,
  RefreshCw,
  X,
  Image as ImageIcon,
  Activity,
  LogIn,
  LogOut,
  UserCheck,
  ArrowLeftRight,
  Star,
  User as UserIcon
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { syncLocalSkillsToCloud } from '../api/cloudSync';

const MyProfile = () => {
  const { user, refreshUser, updateUser } = useAuth();

  // Basic Info Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Skill Management State
  const [mySkills, setMySkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Add/Edit Skill Modal State
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillTitle, setSkillTitle] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillCategory, setSkillCategory] = useState('Programming');
  const [skillType, setSkillType] = useState('offered');
  const [skillProficiency, setSkillProficiency] = useState('Intermediate');

  // Direct Avatar / Profile Image Upload State
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Feedback notifications
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoError, setInfoError] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    // Automatically trigger cloud sync in the background on profile load
    syncLocalSkillsToCloud().catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLocation(user.location || '');
      setAvatar(user.avatar || '');
      setBio(user.bio || '');
      setAvailability(user.availability || 'Weekends & Evenings');
      setIsPublic(user.isPublic !== undefined ? user.isPublic : true);
    }
  }, [user]);

  const fetchMySkills = async () => {
    try {
      setLoadingSkills(true);
      const res = await api.get('/auth/me');
      const u = res.data?.user || user;
      const skillsFromRes = res.data?.skills;
      const combined = (Array.isArray(skillsFromRes) && skillsFromRes.length > 0)
        ? skillsFromRes
        : [
            ...(u?.skillsOffered || []),
            ...(u?.skillsWanted || []),
            ...(Array.isArray(u?.skills) ? u.skills : [])
          ];
      setMySkills(combined || []);
    } catch (err) {
      console.error('Failed to load my skills', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  // User Account Activity Trail State
  const [accountActivities, setAccountActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchAccountActivities = async () => {
    try {
      setLoadingActivities(true);
      const res = await api.get('/notifications');
      const items = Array.isArray(res.data)
        ? res.data
        : (res.data?.notifications || []);
      setAccountActivities(items);
    } catch (err) {
      console.error('Failed to load account activities', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchMySkills();
    fetchAccountActivities();

    const handleActivityEvent = () => {
      fetchMySkills();
      fetchAccountActivities();
    };
    window.addEventListener('skillswap:activity-updated', handleActivityEvent);
    window.addEventListener('skillswap:profile-updated', handleActivityEvent);
    return () => {
      window.removeEventListener('skillswap:activity-updated', handleActivityEvent);
      window.removeEventListener('skillswap:profile-updated', handleActivityEvent);
    };
  }, [user?.id]);

  const renderActivityIcon = (type) => {
    switch (type) {
      case 'auth_login':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <LogIn className="w-3.5 h-3.5" />
          </div>
        );
      case 'auth_logout':
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </div>
        );
      case 'account_created':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#FAA121]/20 text-[#FAA121] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
      case 'account_switch':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/40 text-[#166534] flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        );
      case 'skill_created':
      case 'skill_updated':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/40 text-[#166534] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        );
      case 'skill_deleted':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </div>
        );
      case 'profile_updated':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#E05504]/15 text-[#E05504] flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        );
      case 'swap_sent':
      case 'swap_request':
      case 'swap_accepted':
      case 'swap_completed':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
        );
      case 'rating_received':
      case 'rating_submitted':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const formatActivityTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return '';
    }
  };

  // In-browser client-side image optimization & base64 encoding
  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Please upload an image file (JPEG, PNG, WEBP, or GIF).'));
      }
      if (file.size > 15 * 1024 * 1024) {
        return reject(new Error('Image file is too large (max 15MB).'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL (JPEG at 88% quality gives superb clarity at ~40KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load selected image.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file from your device.'));
      reader.readAsDataURL(file);
    });
  };

  // Direct 1-click upload and instant profile persistence
  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setImageUploading(true);
      setInfoError('');
      const compressedDataUrl = await processImageFile(file);
      setAvatar(compressedDataUrl);

      // Save directly to user profile on server immediately
      const res = await api.put('/users/profile', {
        avatar: compressedDataUrl
      });
      updateUser(res.data.user);
      setInfoSuccess('Profile photo updated successfully!');
      setTimeout(() => setInfoSuccess(''), 3500);
    } catch (err) {
      setInfoError(err.message || 'Failed to update profile photo.');
    } finally {
      setImageUploading(false);
    }
  };

  // Direct reset to default avatar
  const handleRemovePhoto = async () => {
    try {
      setImageUploading(true);
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}_${Date.now()}`;
      setAvatar(defaultAvatar);
      const res = await api.put('/users/profile', {
        avatar: defaultAvatar
      });
      updateUser(res.data.user);
      setInfoSuccess('Profile photo reset to default avatar.');
      setTimeout(() => setInfoSuccess(''), 3000);
    } catch (err) {
      setInfoError('Failed to reset photo.');
    } finally {
      setImageUploading(false);
    }
  };

  // Direct roll a fresh creative avatar
  const handleRandomAvatar = async () => {
    try {
      setImageUploading(true);
      const randomSeed = Math.random().toString(36).substring(7);
      const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
      setAvatar(newAvatar);
      const res = await api.put('/users/profile', {
        avatar: newAvatar
      });
      updateUser(res.data.user);
      setInfoSuccess('Fresh avatar generated!');
      setTimeout(() => setInfoSuccess(''), 3000);
    } catch (err) {
      setInfoError('Failed to generate avatar.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoSuccess('');
    setInfoError('');

    try {
      const res = await api.put('/users/profile', {
        name: name.trim(),
        location: location.trim(),
        avatar: (avatar || '').trim(),
        bio: bio.trim(),
        availability: availability.trim(),
        isPublic: Boolean(isPublic)
      });

      updateUser(res.data.user);
      setInfoSuccess('Profile updated successfully!');
      setTimeout(() => setInfoSuccess(''), 3000);
    } catch (err) {
      setInfoError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingInfo(false);
    }
  };

  // Skill CRUD
  const openAddSkillModal = (type = 'offered') => {
    setEditingSkillId(null);
    setSkillType(type);
    setSkillTitle('');
    setSkillDesc('');
    setSkillCategory('Programming');
    setSkillProficiency('Intermediate');
    setIsSkillModalOpen(true);
  };

  const openEditSkillModal = (skill) => {
    setEditingSkillId(skill.id);
    setSkillType(skill.type);
    setSkillTitle(skill.title);
    setSkillDesc(skill.description);
    setSkillCategory(skill.category);
    setSkillProficiency(skill.proficiency);
    setIsSkillModalOpen(true);
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    try {
      if (editingSkillId) {
        await api.put(`/skills/${editingSkillId}`, {
          title: skillTitle.trim(),
          description: skillDesc.trim(),
          category: skillCategory,
          type: skillType,
          proficiency: skillProficiency
        });
      } else {
        await api.post('/skills', {
          title: skillTitle.trim(),
          description: skillDesc.trim(),
          category: skillCategory,
          type: skillType,
          proficiency: skillProficiency
        });
      }
      setIsSkillModalOpen(false);
      await fetchMySkills();
      await refreshUser();
      window.dispatchEvent(new CustomEvent('skillswap:profile-updated'));
      window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save skill.');
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    try {
      await api.delete(`/skills/${id}`);
      await fetchMySkills();
      await refreshUser();
      window.dispatchEvent(new CustomEvent('skillswap:profile-updated'));
      window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete skill.');
    }
  };

  // Deduplicate skills defensively by type and normalized title so no skill is ever repeated
  const deduplicatedSkills = mySkills.filter((s, idx, arr) => {
    const key = `${s.type}::${(s.title || '').trim().toLowerCase()}`;
    return arr.findIndex((x) => `${x.type}::${(x.title || '').trim().toLowerCase()}` === key) === idx;
  });

  const skillsOffered = deduplicatedSkills.filter((s) => s.type === 'offered');
  const skillsWanted = deduplicatedSkills.filter((s) => s.type === 'wanted');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account & Skill Management</h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Customize your profile, configure your weekly availability, toggle visibility, and update your skill inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info & Privacy Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="neo-card p-6">
            <h2 className="text-base font-black text-slate-900 mb-4 pb-3 border-b border-slate-200/60 flex items-center justify-between">
              <span>Basic Information</span>
              <StatusBadge status={isPublic ? 'public' : 'private'} />
            </h2>

            {infoSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{infoSuccess}</span>
              </div>
            )}

            {infoError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{infoError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Direct Profile Photo Upload & Manager */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Profile Photo:
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Direct Upload</span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`p-3.5 rounded-2xl transition-all border-2 ${
                    isDragging
                      ? 'border-[#E05504] bg-[#FEF8E0] neo-inset'
                      : 'border-dashed border-[#F0ECC7] hover:border-[#FAA121] bg-[#F0ECC7]/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Interactive Avatar with Click-to-Upload & Camera Overlay */}
                    <div
                      onClick={() => !imageUploading && fileInputRef.current?.click()}
                      className="relative group cursor-pointer flex-shrink-0"
                      title="Click directly to choose a photo from your computer or phone"
                    >
                      <img
                        src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`}
                        alt="Profile Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-stone-900/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                        <Camera className="w-5 h-5 drop-shadow-sm" />
                        <span className="text-[9px] font-bold mt-0.5">Change</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg neo-btn-primary flex items-center justify-center text-white shadow-xs">
                        <Camera className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Action Buttons & Hint */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUploading}
                          className="px-3 py-1.5 rounded-xl neo-btn text-xs font-bold text-[#E05504] hover:text-[#c2410c] flex items-center gap-1.5 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{imageUploading ? 'Processing...' : 'Upload Photo'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRandomAvatar}
                          disabled={imageUploading}
                          className="px-2.5 py-1.5 rounded-xl neo-btn text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-all"
                          title="Generate a fun random avatar"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Random</span>
                        </button>

                        {avatar && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={imageUploading}
                            className="px-2 py-1.5 rounded-xl neo-btn text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-all"
                            title="Reset to default avatar"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 font-medium">
                        Click avatar or drag & drop. Supports JPG, PNG, WEBP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name:
                </label>
                <div className="neo-inset rounded-xl px-2.5 py-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-1.5 text-xs text-slate-800 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Location (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location (Optional):
                </label>
                <div className="flex items-center neo-inset rounded-xl px-2.5 py-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="w-full py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* General Availability Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  General Availability:
                </label>
                <div className="flex items-center neo-inset rounded-xl px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-[#E05504] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="e.g. Weekends, Weekday Evenings, 5 hrs/wk"
                    className="w-full py-1.5 text-xs text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none font-medium"
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block font-medium">
                  Shown to other users so they propose swaps matching your schedule.
                </span>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Bio / Background:
                </label>
                <div className="neo-inset rounded-xl p-2">
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a brief summary of your background and what you are hoping to learn..."
                    className="w-full text-xs p-1 text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Privacy Control Toggle */}
              <div className="pt-3 border-t border-[#F0ECC7]">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Profile Visibility Control:
                </label>
                <div className="flex items-center justify-between p-3.5 neo-inset rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    {isPublic ? (
                      <Globe className="w-5 h-5 text-[#166534]" />
                    ) : (
                      <Lock className="w-5 h-5 text-stone-500" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        {isPublic ? 'Public Profile' : 'Private Profile'}
                      </span>
                      <span className="text-[11px] text-stone-500 block font-medium">
                        {isPublic
                          ? 'Visible in public directory & search'
                          : 'Hidden from browse & search'}
                      </span>
                    </div>
                  </div>

                  {/* Neomorphic Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPublic ? 'bg-[#E05504] neo-inset' : 'bg-stone-300 neo-inset'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-1 ml-1 ${
                        isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={savingInfo}
                className="w-full py-3 px-4 neo-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingInfo ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Separate Lists for Skills Offered & Skills Wanted */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Skills Offered List */}
          <div className="neo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECC7]">
              <div>
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E05504]"></span>
                  Skills Offered ({skillsOffered.length})
                </h2>
                <p className="text-xs text-stone-500 font-medium">Skills you are ready to teach or share with peers</p>
              </div>
              <button
                onClick={() => openAddSkillModal('offered')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 neo-btn-primary text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Offered Skill</span>
              </button>
            </div>

            {skillsOffered.length === 0 ? (
              <div className="py-8 text-center neo-inset rounded-2xl p-6 space-y-2">
                <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">You haven't listed any skills offered yet.</p>
                <button
                  onClick={() => openAddSkillModal('offered')}
                  className="text-xs font-bold text-[#E05504] hover:text-[#c2410c]"
                >
                  + Add your first offered skill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillsOffered.map((skill) => (
                  <div
                    key={skill.id}
                    className="neo-card-sm p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-md neo-inset text-stone-700 font-bold">
                          {skill.category}
                        </span>
                        <span className="text-[11px] font-bold text-[#166534] bg-[#AFDFB5]/40 px-2 py-0.5 rounded-md border border-[#AFDFB5]">
                          {skill.proficiency}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mb-1">{skill.title}</h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3 font-normal">
                        {skill.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F0ECC7] flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditSkillModal(skill)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 neo-btn rounded-lg"
                        title="Edit skill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 neo-btn rounded-lg"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Skills Wanted List */}
          <div className="neo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Skills Wanted ({skillsWanted.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">Skills you are eager to learn from other community members</p>
              </div>
              <button
                onClick={() => openAddSkillModal('wanted')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 neo-btn text-xs font-bold rounded-xl text-amber-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Wanted Skill</span>
              </button>
            </div>

            {skillsWanted.length === 0 ? (
              <div className="py-8 text-center neo-inset rounded-2xl p-6 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">You haven't listed any skills wanted yet.</p>
                <button
                  onClick={() => openAddSkillModal('wanted')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  + Add your first wanted skill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillsWanted.map((skill) => (
                  <div
                    key={skill.id}
                    className="neo-card-sm p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-md neo-inset text-slate-700 font-bold">
                          {skill.category}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Target: {skill.proficiency}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{skill.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3 font-normal">
                        {skill.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditSkillModal(skill)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 neo-btn rounded-lg"
                        title="Edit skill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 neo-btn rounded-lg"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Account Activity Trail */}
          <div className="neo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECC7]">
              <div>
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#E05504]" />
                  Account Activity Trail ({accountActivities.length})
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Real-time persistent history of logins, session logouts, account switches, skills, and swaps in your account.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAccountActivities}
                className="p-2 rounded-xl neo-btn text-stone-400 hover:text-[#E05504] transition-colors"
                title="Refresh activities"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingActivities ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingActivities ? (
              <div className="py-8 text-center text-xs text-stone-400">Loading activity trail...</div>
            ) : accountActivities.length === 0 ? (
              <div className="py-8 text-center neo-inset rounded-2xl p-6 space-y-2">
                <Activity className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">No activity recorded for this account yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {accountActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl neo-card-sm flex items-start gap-3 hover:bg-white/80 transition-all"
                  >
                    <div className="mt-0.5 flex-shrink-0">{renderActivityIcon(act.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-800 truncate">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium flex-shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatActivityTime(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed break-words">
                        {act.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Skill Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="neo-card max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-stone-900 mb-1">
              {editingSkillId ? 'Edit Skill' : `Add ${skillType === 'offered' ? 'Offered' : 'Wanted'} Skill`}
            </h3>
            <p className="text-xs font-medium text-stone-500 mb-4">
              Describe the skill clearly so other members can find and match with you.
            </p>

            <form onSubmit={handleSaveSkill} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  List Type:
                </label>
                <div className="grid grid-cols-2 gap-2 neo-inset p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSkillType('offered')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      skillType === 'offered'
                        ? 'neo-btn text-[#E05504] font-extrabold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Skill Offered (I Teach)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillType('wanted')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      skillType === 'wanted'
                        ? 'neo-btn text-[#FAA121] font-extrabold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Skill Wanted (I Learn)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Skill Title:
                </label>
                <div className="neo-inset rounded-xl px-2.5 py-1">
                  <input
                    type="text"
                    required
                    value={skillTitle}
                    onChange={(e) => setSkillTitle(e.target.value)}
                    placeholder="e.g. Adobe Photoshop, Advanced Excel, React Development"
                    className="w-full py-1.5 text-xs text-slate-800 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Category & Proficiency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category:
                  </label>
                  <select
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 neo-card-sm text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Languages">Languages</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Music & Arts">Music & Arts</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {skillType === 'offered' ? 'Proficiency Level:' : 'Target Proficiency:'}
                  </label>
                  <select
                    value={skillProficiency}
                    onChange={(e) => setSkillProficiency(e.target.value)}
                    className="w-full text-xs px-3 py-2 neo-card-sm text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description:
                </label>
                <div className="neo-inset rounded-xl p-2">
                  <textarea
                    rows={3}
                    required
                    value={skillDesc}
                    onChange={(e) => setSkillDesc(e.target.value)}
                    placeholder="Outline topics covered, tools used, or specific goals..."
                    className="w-full text-xs p-1 text-slate-800 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 neo-btn rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white neo-btn-primary rounded-xl"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
