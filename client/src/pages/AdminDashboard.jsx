import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  ArrowLeftRight,
  Send,
  Download,
  CheckCircle,
  XCircle,
  Trash2,
  Bell,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Activity,
  UserX,
  UserCheck
} from 'lucide-react';
import api from '../api/axiosClient';
import StatusBadge from '../components/StatusBadge';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillStatusFilter, setSkillStatusFilter] = useState('All');
  const [swapStatusFilter, setSwapStatusFilter] = useState('All');

  // Broadcast creation form
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcType, setBcType] = useState('announcement');
  const [bcSubmitting, setBcSubmitting] = useState(false);
  const [bcSuccess, setBcSuccess] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/skills'),
        api.get('/admin/swaps'),
        api.get('/admin/broadcasts')
      ]);

      const [statsRes, usersRes, skillsRes, swapsRes, bcRes] = results;

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data)) {
        setUsers(usersRes.value.data);
      }
      if (skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value?.data)) {
        setSkills(skillsRes.value.data);
      }
      if (swapsRes.status === 'fulfilled' && Array.isArray(swapsRes.value?.data)) {
        setSwaps(swapsRes.value.data);
      }
      if (bcRes.status === 'fulfilled' && Array.isArray(bcRes.value?.data)) {
        setBroadcasts(bcRes.value.data);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. User Moderation: Ban / Unban
  const handleToggleBan = async (userId, currentBanStatus, userName) => {
    const action = currentBanStatus ? 'reinstate' : 'suspend';
    const reason = window.prompt(
      `Please provide a reason to ${action} user "${userName}":`,
      currentBanStatus ? 'User appealed suspension' : 'Violation of community guidelines'
    );
    if (reason === null) return;

    try {
      await api.put(`/admin/users/${userId}/ban`, {
        isBanned: !currentBanStatus,
        reason
      });
      await loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} user.`);
    }
  };

  // 2. Content Moderation: Reject/Flag/Approve or Delete Skill
  const handleModerateSkill = async (skillId, newStatus, skillTitle) => {
    const reason = window.prompt(
      `Set status to "${newStatus}" for "${skillTitle}". Enter moderation note:`,
      newStatus === 'rejected' ? 'Spammy or inappropriate description' : 'Approved after manual inspection'
    );
    if (reason === null) return;

    try {
      await api.put(`/admin/skills/${skillId}/moderate`, {
        status: newStatus,
        reason
      });
      await loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to moderate skill.');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Permanently delete this skill listing from the platform?')) return;
    try {
      await api.delete(`/admin/skills/${skillId}`);
      await loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete skill.');
    }
  };

  // 3. Platform Messaging: Create Broadcast
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) return;

    setBcSubmitting(true);
    setBcSuccess('');
    try {
      await api.post('/admin/broadcasts', {
        title: bcTitle.trim(),
        message: bcMessage.trim(),
        type: bcType
      });

      setBcTitle('');
      setBcMessage('');
      setBcSuccess('Platform announcement broadcasted to all users!');
      setTimeout(() => setBcSuccess(''), 3000);
      await loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish announcement.');
    } finally {
      setBcSubmitting(false);
    }
  };

  const handleToggleBroadcast = async (id) => {
    try {
      await api.put(`/admin/broadcasts/${id}/toggle`);
      await loadAllData();
    } catch (err) {
      alert('Failed to toggle announcement state.');
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/broadcasts/${id}`);
      await loadAllData();
    } catch (err) {
      alert('Failed to delete announcement.');
    }
  };

  // 4. Downloadable Reports
  const handleDownloadReport = async (endpoint, filename) => {
    try {
      const response = await api.get(`/admin/reports/${endpoint}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Failed to download ${filename}.`);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!u) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.location && u.location.toLowerCase().includes(q))
    );
  });

  const filteredSkills = skills.filter((s) => {
    if (!s) return false;
    const matchesStatus = skillStatusFilter === 'All' || (s.status || 'active') === skillStatusFilter;
    if (!matchesStatus) return false;
    if (!skillSearch.trim()) return true;
    const q = skillSearch.toLowerCase();
    return (
      (s.title || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  });

  const filteredSwaps = swaps.filter((s) => {
    if (!s) return false;
    if (swapStatusFilter === 'All') return true;
    return s.status === swapStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neo-card p-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl neo-btn-primary flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              Administrator Command Console
              <span className="text-[10px] font-black bg-[#FAA121]/30 text-[#78350f] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Superadmin
              </span>
            </h1>
            <p className="text-xs font-medium text-stone-500 mt-0.5">
              Platform governance, content moderation, user suspension, swap monitoring, and reporting
            </p>
          </div>
        </div>

        <button
          onClick={loadAllData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 neo-btn rounded-xl text-xs font-bold text-stone-700 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
          <span>Refresh All Metrics</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 neo-inset p-1.5 rounded-2xl overflow-x-auto">
        {[
          { id: 'overview', label: 'Platform Monitoring', icon: Activity },
          { id: 'users', label: `User Moderation (${users.length})`, icon: Users },
          { id: 'content', label: `Content Moderation (${skills.length})`, icon: AlertTriangle },
          { id: 'swaps', label: `All Swaps (${swaps.length})`, icon: ArrowLeftRight },
          { id: 'messaging', label: 'Platform Messaging', icon: Bell },
          { id: 'reports', label: 'Downloadable Reports', icon: Download }
        ].map((tab) => {
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
            </button>
          );
        })}
      </div>

      {/* TAB 1: Platform Monitoring & KPIs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="neo-card p-4">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Total Users</span>
              <span className="text-2xl font-black text-stone-900">{stats?.metrics?.totalUsers ?? stats?.totalUsers ?? users.length ?? 0}</span>
              <span className="text-[11px] text-stone-400 block mt-1 font-medium">
                {stats?.metrics?.bannedUsers ?? stats?.bannedUsers ?? users.filter(u => u?.isBanned).length ?? 0} suspended
              </span>
            </div>

            <div className="neo-card p-4">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Total Skills</span>
              <span className="text-2xl font-black text-stone-900">{stats?.metrics?.totalSkills ?? stats?.totalSkills ?? skills.length ?? 0}</span>
              <span className="text-[11px] text-[#166534] block mt-1 font-semibold">
                {stats?.metrics?.activeSkills ?? stats?.activeSkills ?? skills.filter(s => (s?.status || 'active') === 'active').length ?? 0} active
              </span>
            </div>

            <div className="neo-card p-4">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Pending Swaps</span>
              <span className="text-2xl font-black text-[#FAA121]">{stats?.metrics?.pendingSwaps ?? stats?.pendingSwaps ?? swaps.filter(s => s?.status === 'pending').length ?? 0}</span>
              <span className="text-[11px] text-stone-400 block mt-1 font-medium">Awaiting acceptance</span>
            </div>

            <div className="neo-card p-4">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Active Swaps</span>
              <span className="text-2xl font-black text-[#E05504]">{stats?.metrics?.acceptedSwaps ?? stats?.acceptedSwaps ?? stats?.activeSwaps ?? swaps.filter(s => s?.status === 'accepted').length ?? 0}</span>
              <span className="text-[11px] text-slate-400 block mt-1 font-medium">In collaboration</span>
            </div>

            <div className="neo-card p-4">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Completed Swaps</span>
              <span className="text-2xl font-black text-emerald-600">{stats?.metrics?.completedSwaps ?? stats?.completedSwaps ?? swaps.filter(s => s?.status === 'completed').length ?? 0}</span>
              <span className="text-[11px] text-slate-400 block mt-1 font-medium">Verified exchanges</span>
            </div>

            <div className="neo-card p-4">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Reviews Logged</span>
              <span className="text-2xl font-black text-slate-900">{stats?.metrics?.totalRatings ?? stats?.totalRatings ?? stats?.totalReviews ?? 0}</span>
              <span className="text-[11px] text-slate-400 block mt-1 font-medium">Feedback entries</span>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="neo-card p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Recent Administrative Audit Logs</h3>
            <div className="divide-y divide-slate-200/60 text-xs">
              {(stats?.recentLogs || []).map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg neo-inset text-slate-700 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-700 font-medium">{log.details}</span>
                  </div>
                  <span className="text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: User Moderation */}
      {activeTab === 'users' && (
        <div className="neo-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">User Account Moderation</h2>
              <p className="text-xs font-medium text-slate-500">
                View all registered accounts, inspect profiles, and ban or reinstate accounts violating policies
              </p>
            </div>

            <div className="flex items-center neo-inset rounded-xl px-3 py-1 w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full py-1 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto neo-inset p-1 rounded-xl">
            <table className="min-w-full divide-y divide-[#F0ECC7] text-xs">
              <thead className="bg-[#F0ECC7]/70 text-stone-700 font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Profile Mode</th>
                  <th className="px-4 py-3 text-left">Account Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECC7] bg-[var(--neo-bg)]/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-slate-500 text-[11px] block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        u.role === 'admin' ? 'bg-[#FAA121]/30 text-[#78350f]' : 'neo-inset text-stone-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {u.location || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {(u.skills || []).length} listed
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={u.isPublic ? 'public' : 'private'} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <UserX className="w-3.5 h-3.5" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleBan(u.id, u.isBanned, u.name)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                            u.isBanned
                              ? 'neo-btn-success text-white'
                              : 'neo-btn-danger text-white'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban / Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Content Moderation */}
      {activeTab === 'content' && (
        <div className="neo-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Content Moderation Queue</h2>
              <p className="text-xs font-medium text-slate-500">
                Audit skill titles and descriptions to reject or delete inappropriate or spammy content
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={skillStatusFilter}
                onChange={(e) => setSkillStatusFilter(e.target.value)}
                className="px-3 py-1.5 neo-card-sm text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="flagged">Flagged Only</option>
                <option value="rejected">Rejected Only</option>
              </select>

              <div className="flex items-center neo-inset rounded-xl px-2.5 py-1 w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Filter skills..."
                  className="w-full py-1 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSkills.map((s) => (
              <div
                key={s.id}
                className="neo-card-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <StatusBadge status={s.type} />
                    <span className="text-xs text-slate-500 font-semibold">Category: {s.category}</span>
                    <span className="text-xs text-slate-400">&bull; By {s.user?.name} ({s.user?.email})</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-600 font-normal">{s.description}</p>
                  {s.moderationReason && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block mt-1 font-semibold">
                      Moderation note: {s.moderationReason}
                    </div>
                  )}
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerateSkill(s.id, 'rejected', s.title)}
                      className="px-3.5 py-1.5 neo-btn-danger text-white rounded-xl text-xs font-bold"
                    >
                      Reject Description
                    </button>
                  )}

                  {s.status !== 'active' && (
                    <button
                      onClick={() => handleModerateSkill(s.id, 'active', s.title)}
                      className="px-3.5 py-1.5 neo-btn-success text-white rounded-xl text-xs font-bold"
                    >
                      Approve / Restore
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteSkill(s.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 neo-btn rounded-xl"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Platform Swap Monitoring */}
      {activeTab === 'swaps' && (
        <div className="neo-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Platform-Wide Swap Monitoring</h2>
              <p className="text-xs font-medium text-slate-500">
                Track real-time swap agreements across pending, accepted, completed, or cancelled statuses
              </p>
            </div>

            <select
              value={swapStatusFilter}
              onChange={(e) => setSwapStatusFilter(e.target.value)}
              className="px-3 py-1.5 neo-card-sm text-xs font-semibold text-slate-700 self-start focus:outline-none"
            >
              <option value="All">All Statuses ({swaps.length})</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted / Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto neo-inset p-1 rounded-xl">
            <table className="min-w-full divide-y divide-[#F0ECC7] text-xs">
              <thead className="bg-[#F0ECC7]/70 text-stone-700 font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requester</th>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Offered Skill</th>
                  <th className="px-4 py-3 text-left">Wanted Skill</th>
                  <th className="px-4 py-3 text-left">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECC7] bg-[var(--neo-bg)]/60">
                {filteredSwaps.map((s) => (
                  <tr key={s.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                      {s.requester?.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                      {s.recipient?.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {s.offeredSkill ? s.offeredSkill.title : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {s.wantedSkill ? s.wantedSkill.title : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-medium">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Platform Messaging (Broadcasts) */}
      {activeTab === 'messaging' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className="lg:col-span-1 neo-card p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Create Platform Announcement</h3>
            <p className="text-xs font-medium text-slate-500">
              Send global banners visible to all users (feature updates, policy changes, downtime alerts).
            </p>

            {bcSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{bcSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Title:
                </label>
                <div className="neo-inset rounded-xl p-1">
                  <input
                    type="text"
                    required
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance Notice"
                    className="w-full text-xs px-2.5 py-1.5 bg-transparent focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notification Type:
                </label>
                <select
                  value={bcType}
                  onChange={(e) => setBcType(e.target.value)}
                  className="w-full text-xs px-3 py-2 neo-card-sm text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="announcement">General Announcement</option>
                  <option value="maintenance">Maintenance / Downtime Alert</option>
                  <option value="update">Feature Update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Body:
                </label>
                <div className="neo-inset rounded-xl p-1">
                  <textarea
                    rows={3}
                    required
                    value={bcMessage}
                    onChange={(e) => setBcMessage(e.target.value)}
                    placeholder="Full message displayed across the banner..."
                    className="w-full text-xs p-2 bg-transparent focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={bcSubmitting}
                className="w-full py-2.5 px-4 neo-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{bcSubmitting ? 'Publishing...' : 'Broadcast Platform Message'}</span>
              </button>
            </form>
          </div>

          {/* Announcements List */}
          <div className="lg:col-span-2 neo-card p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Active & Past Announcements</h3>
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl neo-card-sm transition-all flex items-center justify-between gap-4 ${
                    b.isActive ? '' : 'opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        b.type === 'maintenance' ? 'bg-[#FAA121]/20 text-[#78350f]' : 'bg-[#AFDFB5]/40 text-[#166534]'
                      }`}>
                        {b.type}
                      </span>
                      <span className="text-xs font-bold text-stone-900">{b.title}</span>
                    </div>
                    <p className="text-xs text-stone-600">{b.message}</p>
                    <span className="text-[10px] text-stone-400 block mt-1 font-medium">
                      Published {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleBroadcast(b.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold neo-btn ${
                        b.isActive ? 'text-stone-700' : 'text-[#E05504] font-extrabold'
                      }`}
                    >
                      {b.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteBroadcast(b.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 neo-btn rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Downloadable Activity Reports */}
      {activeTab === 'reports' && (
        <div className="neo-card p-6 space-y-6">
          <div>
            <h2 className="text-base font-black text-stone-900">Activity Reports & Data Exports</h2>
            <p className="text-xs font-medium text-stone-500">
              Generate and download comprehensive CSV files for user analytics, audit compliance, and swap statistics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Activity Report */}
            <div className="p-6 rounded-2xl neo-card-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl neo-inset text-[#E05504] flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-stone-900">User Activity Logs</h4>
                <p className="text-xs text-stone-500 leading-relaxed mt-1 font-normal">
                  Full registry of user accounts, registration timestamps, locations, availability, and active swap totals.
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport('users/csv', 'user_activity_report.csv')}
                className="w-full py-2.5 px-3 neo-btn text-xs font-bold text-stone-800 rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#E05504]" />
                <span>Export Users CSV</span>
              </button>
            </div>

            {/* Swap Statistics Report */}
            <div className="p-6 rounded-2xl neo-card-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl neo-inset text-emerald-700 flex items-center justify-center mb-3">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Swap Statistics Report</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 font-normal">
                  Historical archive of all initiated swaps, offered and wanted skill pairs, completion rates, and status.
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport('swaps/csv', 'swap_statistics_report.csv')}
                className="w-full py-2.5 px-3 neo-btn text-xs font-bold text-slate-800 rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Swaps CSV</span>
              </button>
            </div>

            {/* Feedback Logs */}
            <div className="p-6 rounded-2xl neo-card-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl neo-inset text-amber-700 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Feedback & Ratings Logs</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 font-normal">
                  Complete audit of all post-swap reviews, 1-5 star scores, written testimonials, and target recipients.
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport('feedback/csv', 'feedback_ratings_report.csv')}
                className="w-full py-2.5 px-3 neo-btn text-xs font-bold text-slate-800 rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Export Feedback CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
