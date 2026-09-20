import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const RequestSwapModal = ({ isOpen, onClose, targetSkill, targetUser, onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [myOfferedSkills, setMyOfferedSkills] = useState([]);
  const [selectedOfferedSkillId, setSelectedOfferedSkillId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const recipient = targetUser || targetSkill?.user;

  useEffect(() => {
    const fetchMySkills = async () => {
      try {
        const res = await api.get('/auth/me');
        const offered = (res.data.skills || []).filter(s => s.type === 'offered' && s.status === 'active');
        setMyOfferedSkills(offered);
        if (offered.length > 0) {
          setSelectedOfferedSkillId(offered[0].id);
        }
      } catch (err) {
        console.error('Failed to load user skills for swap proposal:', err);
      }
    };

    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setMessage('');
      fetchMySkills();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/swaps', {
        recipientId: recipient?.id,
        offeredSkillId: selectedOfferedSkillId || null,
        wantedSkillId: targetSkill?.id || null,
        message: message.trim()
      });

      setSuccessMsg('Swap proposal sent successfully!');
      await refreshUser();
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit swap proposal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="neo-card max-w-lg w-full p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 neo-btn"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl neo-btn-primary flex items-center justify-center text-white">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900">Propose a Skill Swap</h2>
            <p className="text-xs font-medium text-stone-500">
              Collaborate with <span className="font-bold text-stone-800">{recipient?.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#AFDFB5]/40 border border-[#AFDFB5] text-[#166534] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Skill details */}
          {targetSkill && (
            <div className="neo-inset p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Skill You Are Requesting:
              </span>
              <div className="text-sm font-bold text-stone-900">{targetSkill.title}</div>
              <div className="text-xs text-stone-500 line-clamp-1 font-normal">{targetSkill.description}</div>
            </div>
          )}

          {/* User's Offered Skill Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Your Skill To Offer in Return:
            </label>
            {myOfferedSkills.length > 0 ? (
              <select
                value={selectedOfferedSkillId}
                onChange={(e) => setSelectedOfferedSkillId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 neo-card-sm text-stone-800 bg-[#FEF8E0] font-semibold focus:outline-none"
              >
                {myOfferedSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.category} - {s.proficiency})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-[#FAA121]/15 border border-[#FAA121]/40 rounded-xl text-[#78350f] text-xs font-medium">
                You haven't added any "Skills Offered" to your profile yet. You can still send a general proposal note, or add skills in your profile.
              </div>
            )}
          </div>

          {/* Proposal Message */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Proposal Note / Schedule Suggestion:
            </label>
            <div className="neo-inset rounded-xl p-2">
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., Hi! I'd love to exchange a 2-hour session on weekends..."
                className="w-full text-xs p-1 text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0ECC7]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 neo-btn rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white neo-btn-primary rounded-xl shadow-xs"
            >
              {loading ? 'Submitting...' : 'Send Swap Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestSwapModal;
