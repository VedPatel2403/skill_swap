import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  Star,
  Clock,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import FeedbackModal from '../components/FeedbackModal';

const SwapsDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [swapsData, setSwapsData] = useState({
    incomingPending: [],
    outgoingPending: [],
    active: [],
    completed: [],
    past: [],
    counts: {}
  });
  const [activeTab, setActiveTab] = useState('incoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Feedback modal
  const [feedbackSwap, setFeedbackSwap] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const fetchSwaps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/swaps/my-swaps');
      setSwapsData(res.data);
    } catch (err) {
      console.error('Error fetching swaps:', err);
      setError('Failed to load swap dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, []);

  const handleAccept = async (swapId) => {
    setActionLoadingId(swapId);
    try {
      await api.put(`/swaps/${swapId}/accept`);
      await fetchSwaps();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept swap.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (swapId) => {
    const reason = window.prompt('Reason for declining this swap offer (optional):', 'Schedule conflict / Not currently available');
    if (reason === null) return;

    setActionLoadingId(swapId);
    try {
      await api.put(`/swaps/${swapId}/reject`, { reason });
      await fetchSwaps();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject swap.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Requirement: "Allow a user to 'Delete' their own swap request IF it has not been accepted yet."
  const handleDeletePending = async (swapId) => {
    if (!window.confirm('Are you sure you want to delete this pending swap request?')) return;

    setActionLoadingId(swapId);
    try {
      await api.delete(`/swaps/${swapId}`);
      await fetchSwaps();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete swap request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (swapId) => {
    if (!window.confirm('Mark this swap as completed? This will unlock the rating and feedback review!')) return;

    setActionLoadingId(swapId);
    try {
      await api.put(`/swaps/${swapId}/complete`);
      await fetchSwaps();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark swap as completed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openFeedbackModal = (swap) => {
    setFeedbackSwap(swap);
    setIsFeedbackOpen(true);
  };

  const tabs = [
    { id: 'incoming', label: 'Inbound Offers', count: swapsData.incomingPending?.length || 0, icon: Inbox },
    { id: 'outgoing', label: 'Outbound Pending', count: swapsData.outgoingPending?.length || 0, icon: Send },
    { id: 'active', label: 'Active Swaps', count: swapsData.active?.length || 0, icon: RefreshCw },
    { id: 'completed', label: 'Completed', count: swapsData.completed?.length || 0, icon: CheckCircle2 },
    { id: 'past', label: 'Past / Declined', count: swapsData.past?.length || 0, icon: XCircle }
  ];

  const getCurrentList = () => {
    switch (activeTab) {
      case 'incoming':
        return swapsData.incomingPending || [];
      case 'outgoing':
        return swapsData.outgoingPending || [];
      case 'active':
        return swapsData.active || [];
      case 'completed':
        return swapsData.completed || [];
      case 'past':
        return swapsData.past || [];
      default:
        return [];
    }
  };

  const currentList = getCurrentList();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Swap Requests & Exchange Hub</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage your pending proposals, active learning partnerships, and post-swap feedback
          </p>
        </div>
        <button
          onClick={fetchSwaps}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 neo-btn rounded-xl text-xs font-bold text-slate-700 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Neomorphic Tabs */}
      <div className="flex items-center gap-2 neo-inset p-1.5 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                isCurrent
                  ? 'neo-btn text-[#E05504] font-extrabold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-full shadow-xs ${
                    tab.id === 'incoming'
                      ? 'bg-rose-500 text-white'
                      : isCurrent
                      ? 'bg-[#E05504] text-white'
                      : 'bg-stone-300 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="neo-card p-6 h-36 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="neo-card p-12 text-center space-y-3">
          <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No swaps in this section</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
            {activeTab === 'incoming' && 'You have no pending inbound swap offers right now.'}
            {activeTab === 'outgoing' && 'You have not sent any pending swap requests recently.'}
            {activeTab === 'active' && 'No active swaps currently in progress. Propose or accept a swap to get started!'}
            {activeTab === 'completed' && 'No completed swaps yet. Finish an active swap session to submit ratings.'}
            {activeTab === 'past' && 'No past or declined swaps recorded.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((swap) => {
            const isRequester = user?.id === swap.requesterId;
            const partner = isRequester ? swap.recipient : swap.requester;
            const offeredSkill = swap.offeredSkill;
            const wantedSkill = swap.wantedSkill;

            // Check if current user has rated this completed swap
            const hasRated = (swap.ratings || []).some((r) => r.raterId === user?.id);

            return (
              <div
                key={swap.id}
                className="neo-card p-6 space-y-4 hover:-translate-y-0.5 transition-all"
              >
                {/* Header row with partner and status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <img
                      src={partner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.name}`}
                      alt={partner?.name}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">
                        {isRequester ? 'Swap requested with:' : 'Swap offer received from:'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{partner?.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({partner?.location || 'Remote'})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={swap.status} />
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(swap.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Skill trade breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 neo-inset p-4 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                      Skill Being Taught / Offered:
                    </span>
                    <span className="font-bold text-slate-900 block text-xs">
                      {offeredSkill ? offeredSkill.title : 'General Consultation / Not specified'}
                    </span>
                    {offeredSkill && (
                      <span className="text-slate-500 text-[11px] block mt-0.5 font-medium">
                        Category: {offeredSkill.category} &bull; {offeredSkill.proficiency}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                      Skill Being Learned / Wanted:
                    </span>
                    <span className="font-bold text-slate-900 block text-xs">
                      {wantedSkill ? wantedSkill.title : 'General Knowledge Exchange'}
                    </span>
                    {wantedSkill && (
                      <span className="text-slate-500 text-[11px] block mt-0.5 font-medium">
                        Category: {wantedSkill.category} &bull; {wantedSkill.proficiency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Proposal Message */}
                {swap.message && (
                  <div className="text-xs text-stone-700 neo-card-sm p-3.5 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#E05504] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-stone-500 block text-[10px] uppercase tracking-wider">
                        Proposal Note:
                      </span>
                      <p className="italic text-stone-700 mt-0.5">"{swap.message}"</p>
                    </div>
                  </div>
                )}

                {/* Rejection reason if applicable */}
                {swap.rejectionReason && (
                  <div className="text-xs text-rose-700 neo-inset p-3 rounded-xl border border-rose-200 font-medium">
                    <span className="font-bold">Declined Reason: </span>
                    {swap.rejectionReason}
                  </div>
                )}

                {/* Actions row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-stone-500 font-medium">
                    {partner?.availability && (
                      <span className="flex items-center gap-1.5 text-[11px] neo-card-sm px-2.5 py-1">
                        <Clock className="w-3 h-3 text-[#E05504]" />
                        Availability: {partner.availability}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Inbound Pending Actions: Accept or Reject */}
                    {activeTab === 'incoming' && swap.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReject(swap.id)}
                          disabled={actionLoadingId === swap.id}
                          className="px-4 py-2 neo-btn text-xs font-bold rounded-xl"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAccept(swap.id)}
                          disabled={actionLoadingId === swap.id}
                          className="px-5 py-2 neo-btn-success text-xs font-bold rounded-xl"
                        >
                          {actionLoadingId === swap.id ? 'Processing...' : 'Accept Swap'}
                        </button>
                      </>
                    )}

                    {/* Outbound Pending Action: Delete own swap request IF not accepted */}
                    {activeTab === 'outgoing' && swap.status === 'pending' && (
                      <button
                        onClick={() => handleDeletePending(swap.id)}
                        disabled={actionLoadingId === swap.id}
                        className="px-4 py-2 neo-btn-danger text-xs font-bold rounded-xl flex items-center gap-1.5"
                        title="Delete this pending swap request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === swap.id ? 'Deleting...' : 'Delete Request'}</span>
                      </button>
                    )}

                    {/* Active Swap Action: Mark as Completed */}
                    {activeTab === 'active' && swap.status === 'accepted' && (
                      <button
                        onClick={() => handleComplete(swap.id)}
                        disabled={actionLoadingId === swap.id}
                        className="px-5 py-2 neo-btn-primary text-xs font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === swap.id ? 'Updating...' : 'Mark as Completed'}</span>
                      </button>
                    )}

                    {/* Completed Swap Action: Leave Rating & Review (Unlocks post-swap) */}
                    {activeTab === 'completed' && swap.status === 'completed' && (
                      hasRated ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 neo-card-sm px-3.5 py-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Review Submitted</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => openFeedbackModal(swap)}
                          className="px-4 py-2 neo-btn text-xs font-bold rounded-xl flex items-center gap-1.5 text-amber-700"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Leave Rating & Review</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        swap={feedbackSwap}
        onSuccess={() => {
          fetchSwaps();
          refreshUser();
        }}
      />
    </div>
  );
};

export default SwapsDashboard;
