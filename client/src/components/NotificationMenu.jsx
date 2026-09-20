import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  X,
  ArrowLeftRight,
  CheckCheck,
  Clock,
  Star,
  Trash2,
  LogIn,
  LogOut,
  UserCheck,
  PlusCircle,
  Edit2,
  User as UserIcon
} from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const NotificationMenu = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch account-isolated personalized notifications from backend API
  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const items = Array.isArray(res.data)
        ? res.data
        : (res.data?.notifications || []);
      setNotifications(items);
      setUnreadCount(
        res.data?.unreadCount !== undefined
          ? res.data.unreadCount
          : items.filter((n) => !n.isRead).length
      );
    } catch (err) {
      // Silently catch network glitches
      console.warn('Could not fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on authentication change or account switch
  useEffect(() => {
    fetchNotifications();

    const handleActivityUpdated = () => {
      fetchNotifications();
    };
    window.addEventListener('skillswap:activity-updated', handleActivityUpdated);
    window.addEventListener('skillswap:profile-updated', handleActivityUpdated);
    return () => {
      window.removeEventListener('skillswap:activity-updated', handleActivityUpdated);
      window.removeEventListener('skillswap:profile-updated', handleActivityUpdated);
    };
  }, [user?.id, isAuthenticated]);

  // Periodic polling every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Re-fetch when dropdown is opened
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark all notifications as read in backend
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Dismiss / delete single notification
  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        if (item && !item.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Click on notification item
  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await api.put(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  const formatTimeAgo = (dateStr) => {
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

  // Render icon based on personalized activity type
  const renderIcon = (type) => {
    switch (type) {
      case 'auth_login':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <LogIn className="w-4 h-4" />
          </div>
        );
      case 'auth_logout':
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
        );
      case 'account_created':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#FAA121]/20 text-[#FAA121] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'account_switch':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/40 text-[#166534] flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        );
      case 'skill_created':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/40 text-[#166534] flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
        );
      case 'skill_updated':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#FAA121]/20 text-[#FAA121] flex items-center justify-center flex-shrink-0">
            <Edit2 className="w-4 h-4" />
          </div>
        );
      case 'skill_deleted':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
        );
      case 'profile_updated':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#E05504]/15 text-[#E05504] flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4" />
          </div>
        );
      case 'swap_sent':
      case 'swap_request':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/40 text-[#166534] flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        );
      case 'swap_accepted':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/50 text-[#14532d] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'swap_rejected':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'swap_completed':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#AFDFB5]/60 text-[#14532d] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'rating_received':
      case 'rating_submitted':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#FAA121]/25 text-[#78350f] flex items-center justify-center flex-shrink-0">
            <Star className="w-4 h-4 fill-[#FAA121]" />
          </div>
        );
      case 'maintenance':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#E05504]/15 text-[#E05504] flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-[#E05504]/15 text-[#E05504] flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Proper Notification Bell Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all flex items-center justify-center ${
          isOpen ? 'neo-inset text-[#E05504]' : 'neo-btn text-stone-600 hover:text-[#E05504]'
        }`}
        title={`Notifications (${unreadCount} unread)`}
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 transition-transform ${unreadCount > 0 ? 'text-[#E05504]' : ''}`} />

        {/* Dynamic Unread Badge Pill */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#E05504] to-[#FAA121] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div className="!absolute right-0 top-full mt-2.5 w-80 sm:w-96 neo-dropdown p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-[#F0ECC7]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-stone-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#FAA121]/20 text-[#78350f] text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="px-2 py-1 rounded-lg hover:bg-[#F0ECC7]/60 text-stone-500 hover:text-[#E05504] text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-[#F0ECC7]/60 transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-[#F0ECC7]/60 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User Account Scope Notice */}
          {user && (
            <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#F0ECC7]/50 border border-[#F0ECC7] flex items-center justify-between text-[10px] text-stone-600">
              <span className="truncate">Saved in: <strong className="text-stone-800">{user.name}</strong></span>
              <span className="text-[9px] font-bold text-[#E05504] uppercase tracking-wider">Account Isolated</span>
            </div>
          )}

          {/* Notifications Scroll Area */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {!isAuthenticated ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center mx-auto text-stone-400">
                  <Info className="w-5 h-5 text-[#E05504]" />
                </div>
                <div className="text-xs font-bold text-stone-700">Account Login Required</div>
                <div className="text-[11px] text-stone-400">Sign in to view your personal activity alerts and swap updates.</div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="mt-2 px-3 py-1.5 text-xs font-bold neo-btn-primary rounded-xl"
                >
                  Sign In
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center mx-auto text-stone-400">
                  <CheckCircle2 className="w-5 h-5 text-[#AFDFB5]" />
                </div>
                <div className="text-xs font-bold text-stone-700">All caught up!</div>
                <div className="text-[11px] text-stone-400">No activity notifications in your account right now.</div>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer relative group flex gap-3 ${
                      !isRead
                        ? 'neo-inset border border-[#FAA121]/50 bg-[#FEF8E0] shadow-xs'
                        : 'neo-card hover:bg-white/50 opacity-90'
                    }`}
                  >
                    {/* Status Icon */}
                    {renderIcon(item.type)}

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0 pr-5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-stone-800 truncate block">
                          {item.title}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#E05504] flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed break-words">
                        {item.message}
                      </p>
                      {item.createdAt && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-stone-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(item.createdAt)}</span>
                          {item.link && (
                            <span className="ml-1 text-[#E05504] font-bold hover:underline">
                              View details →
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(e, item.id)}
                      className="absolute top-2 right-2 p-1 text-stone-300 hover:text-stone-600 rounded-md hover:bg-[#F0ECC7]/50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Dismiss notification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
