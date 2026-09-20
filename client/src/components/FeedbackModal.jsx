import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';

const FeedbackModal = ({ isOpen, onClose, swap, onSuccess }) => {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !swap) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError('Please provide feedback comments regarding your swap experience.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/ratings', {
        swapId: swap.id,
        score,
        feedback: feedback.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="neo-card max-w-md w-full p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 neo-btn"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl neo-inset text-[#FAA121] flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 fill-[#FAA121] text-[#FAA121]" />
          </div>
          <h2 className="text-lg font-black text-stone-900">Rate Your Skill Swap</h2>
          <p className="text-xs font-medium text-stone-500 mt-0.5">
            Share feedback to help the community build trust and recognize great teachers.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#166534] mx-auto" />
            <h3 className="text-sm font-black text-stone-900">Thank you for your review!</h3>
            <p className="text-xs text-stone-500 font-medium">Your feedback has been recorded on the user's public profile.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating Selector */}
            <div className="flex flex-col items-center justify-center gap-2 py-3 neo-inset rounded-2xl">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScore(star)}
                    onMouseEnter={() => setHoverScore(star)}
                    onMouseLeave={() => setHoverScore(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        (hoverScore || score) >= star
                          ? 'fill-[#FAA121] text-[#FAA121] drop-shadow-[0_2px_8px_rgba(250,161,33,0.5)]'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-stone-700">
                {score === 5 && 'Outstanding & Highly Recommended'}
                {score === 4 && 'Very Good & Helpful'}
                {score === 3 && 'Good / Met Expectations'}
                {score === 2 && 'Fair / Needs Improvement'}
                {score === 1 && 'Disappointing'}
              </span>
            </div>

            {/* Detailed Feedback Textarea */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Detailed Feedback:
              </label>
              <div className="neo-inset rounded-xl p-2">
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe what you learned, punctuality, clarity of instruction, and overall experience..."
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
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
