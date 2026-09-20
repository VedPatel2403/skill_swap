import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
  Inbox,
  Compass,
  ChevronDown,
  Trash2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { useAuth, getSavedAccounts, saveAccountToDevice, removeAccountFromDevice } from '../context/AuthContext';
import api from '../api/axiosClient';
import NotificationMenu from './NotificationMenu';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, pendingIncomingCount, logout, demoLogin, switchAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const demoDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (demoDropdownRef.current && !demoDropdownRef.current.contains(event.target)) {
        setDemoDropdownOpen(false);
      }
    };

    if (demoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [demoDropdownOpen]);

  const loadDemoAccounts = async () => {
    try {
      const saved = getSavedAccounts();
      const savedIds = saved.map((s) => s.id).filter(Boolean);
      const queryParam = savedIds.length > 0 ? `?ids=${savedIds.join(',')}` : '';
      const res = await api.get(`/auth/demo-accounts${queryParam}`);
      const serverAccounts = res.data || [];

      // If any saved account has a stale or green-pixel avatar, update it in localStorage quietly without dispatching
      try {
        let changed = false;
        const updatedSaved = saved.map((s) => {
          const srv = serverAccounts.find(
            (a) => a.id === s.id || a.email?.toLowerCase() === s.email?.toLowerCase()
          );
          if (srv && srv.avatar && s.avatar !== srv.avatar) {
            changed = true;
            return { ...s, avatar: srv.avatar, name: srv.name || s.name, role: srv.role || s.role };
          }
          return s;
        });
        if (changed) {
          localStorage.setItem('skillswap_saved_accounts', JSON.stringify(updatedSaved));
        }
      } catch (e) {}

      setDemoAccounts(serverAccounts);
    } catch (err) {
      console.error('Failed to load demo accounts list', err);
    }
  };

  useEffect(() => {
    loadDemoAccounts();
  }, []);

  // Re-fetch accounts whenever the demo dropdown or mobile menu is opened
  useEffect(() => {
    if (demoDropdownOpen || mobileMenuOpen) {
      loadDemoAccounts();
    }
  }, [demoDropdownOpen, mobileMenuOpen]);

  // Immediately synchronize matching account in demoAccounts in real time when user updates
  useEffect(() => {
    if (user) {
      setDemoAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === user.id || acc.email?.toLowerCase() === user.email?.toLowerCase()) {
            return {
              ...acc,
              name: user.name || acc.name,
              avatar: user.avatar || acc.avatar,
              role: user.role || acc.role,
              location: user.location !== undefined ? user.location : acc.location,
              isBanned: user.isBanned !== undefined ? user.isBanned : acc.isBanned
            };
          }
          return acc;
        })
      );
    }
  }, [user]);

  // Listen for global custom events
  useEffect(() => {
    const handleProfileUpdated = () => {
      loadDemoAccounts();
    };
    window.addEventListener('skillswap:profile-updated', handleProfileUpdated);
    window.addEventListener('skillswap:saved-accounts-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('skillswap:profile-updated', handleProfileUpdated);
      window.removeEventListener('skillswap:saved-accounts-updated', handleProfileUpdated);
    };
  }, []);

  // Helper to ensure current user's profile changes render instantaneously (0ms)
  const getAccountToDisplay = (account) => {
    if (!account) return account;
    if (user && (account.id === user.id || account.email?.toLowerCase() === user.email?.toLowerCase())) {
      return {
        ...account,
        name: user.name || account.name,
        avatar: user.avatar || account.avatar,
        role: user.role || account.role,
        location: user.location !== undefined ? user.location : account.location,
        isBanned: user.isBanned !== undefined ? user.isBanned : account.isBanned
      };
    }
    return account;
  };

  // Combine active user, saved accounts on this device, and demo accounts
  const allSwitchAccounts = (() => {
    if (!isAuthenticated) return [];

    const list = [];
    const seenEmails = new Set();

    // 1. Current user first
    if (user && user.email) {
      list.push(getAccountToDisplay(user));
      seenEmails.add(user.email.toLowerCase());
    }

    // 2. Saved accounts from localStorage on this device
    const saved = getSavedAccounts();
    saved.forEach((acc) => {
      if (acc && acc.email && !seenEmails.has(acc.email.toLowerCase())) {
        list.push(getAccountToDisplay(acc));
        seenEmails.add(acc.email.toLowerCase());
      }
    });

    // 3. Demo accounts from server
    demoAccounts.forEach((acc) => {
      if (acc && acc.email && !seenEmails.has(acc.email.toLowerCase())) {
        list.push(getAccountToDisplay(acc));
        seenEmails.add(acc.email.toLowerCase());
      }
    });

    return list;
  })();

  const handleAccountSwitch = async (account) => {
    try {
      if (user && (account.id === user.id || account.email?.toLowerCase() === user.email?.toLowerCase())) {
        setDemoDropdownOpen(false);
        setMobileMenuOpen(false);
        return;
      }

      await switchAccount(account);
      setDemoDropdownOpen(false);
      setMobileMenuOpen(false);
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/swaps');
      }
    } catch (err) {
      console.error('Account switch failed:', err);
    }
  };

  const handleAddNewAccount = () => {
    setDemoDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/login?mode=add_account');
  };

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      setDeletingAccountId(accountToDelete.id || accountToDelete.email);
      setDeleteError(null);
      
      if (accountToDelete.id) {
        try {
          await api.delete(`/users/${accountToDelete.id}`);
        } catch (delErr) {
          console.warn('API delete user note:', delErr.response?.data?.error || delErr.message);
        }
      }

      // Remove from device storage
      removeAccountFromDevice(accountToDelete.id);
      removeAccountFromDevice(accountToDelete.email);

      // If the deleted account was the currently logged in account, immediately logout!
      if (user && (user.id === accountToDelete.id || user.email?.toLowerCase() === accountToDelete.email?.toLowerCase())) {
        logout();
        navigate('/');
      }

      // Re-fetch the live demo accounts list
      await loadDemoAccounts();

      // Trigger global event so other pages (like Browse, Admin, etc.) refresh
      window.dispatchEvent(new CustomEvent('skillswap:profile-updated'));

      setAccountToDelete(null);
    } catch (err) {
      console.error('Failed to permanently delete account:', err);
      setDeleteError(err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeletingAccountId(null);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 neo-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl neo-btn-primary flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-stone-800 block leading-tight">
                Skill<span className="text-[#E05504]">Swap</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Peer Learning
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link
              to="/browse"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/browse')
                  ? 'neo-inset text-[#E05504] font-bold'
                  : 'text-stone-600 hover:text-stone-900 neo-btn'
              }`}
            >
              <Compass className="w-4 h-4 text-[#E05504]" />
              Browse Skills
            </Link>

            {isAuthenticated && (
              <Link
                to="/swaps"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
                  isActive('/swaps')
                    ? 'neo-inset text-[#E05504] font-bold'
                    : 'text-stone-600 hover:text-stone-900 neo-btn'
                }`}
              >
                <Inbox className="w-4 h-4 text-[#E05504]" />
                My Swaps
                {pendingIncomingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-[#E05504] text-white text-[10px] font-extrabold rounded-full shadow-xs">
                    {pendingIncomingCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/profile"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/profile')
                    ? 'neo-inset text-[#E05504] font-bold'
                    : 'text-stone-600 hover:text-stone-900 neo-btn'
                }`}
              >
                <UserIcon className="w-4 h-4 text-[#E05504]" />
                My Profile
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'neo-inset text-[#E05504] font-bold'
                    : 'text-[#E05504] neo-btn'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#E05504]" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Action Controls: Notifications, Switch Account & Profile / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Proper Notification Icon Dropdown */}
            <NotificationMenu />

            {/* Switch Account Dropdown (Authenticated Only) */}
            {isAuthenticated && (
              <div className="relative" ref={demoDropdownRef}>
              <button
                type="button"
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  demoDropdownOpen ? 'neo-inset text-[#E05504]' : 'neo-btn text-[#E05504]'
                }`}
                title="Quickly switch between accounts"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FAA121]" />
                <span>Switch Account</span>
                <ChevronDown
                  className={`w-3 h-3 text-[#E05504] transition-transform duration-200 ${
                    demoDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {demoDropdownOpen && (
                <div
                  className="!absolute right-0 top-full mt-2.5 w-80 neo-dropdown p-3 z-50 animate-in fade-in zoom-in-95 duration-150 shadow-2xl"
                >
                  <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-200/70">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Switch Account (1-Click)
                    </span>
                    <button
                      type="button"
                      onClick={() => setDemoDropdownOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1 space-y-1.5 pr-1">
                    {allSwitchAccounts.map((rawAccount) => {
                      const account = getAccountToDisplay(rawAccount);
                      const isCurrent = user?.email?.toLowerCase() === account.email?.toLowerCase();
                      const isAdminAccount = account.role === 'admin' || account.email === 'patelvedb2403@gmail.com' || account.email === 'admin@skillswap.com';
                      return (
                        <div
                          key={account.id || account.email}
                          className={`w-full group/acc flex items-center justify-between p-1 rounded-xl transition-all ${
                            isCurrent
                              ? 'neo-inset text-stone-900 font-bold bg-[#AFDFB5]/25 border border-[#AFDFB5]/50'
                              : 'hover:bg-[#F0ECC7]/50 text-stone-700'
                          }`}
                        >
                          {/* 1-Click Switch Button */}
                          <button
                            type="button"
                            onClick={() => handleAccountSwitch(account)}
                            className="flex-1 flex items-center gap-2.5 text-left min-w-0 p-1.5 rounded-lg cursor-pointer"
                            title={isCurrent ? `Currently active: ${account.name}` : `Switch account to ${account.name}`}
                          >
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  account.avatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                    account.name || 'user'
                                  )}`
                                }
                                alt={account.name}
                                className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                              />
                              {isCurrent && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#AFDFB5] border-2 border-stone-800 rounded-full" title="Active" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                <span className="truncate">{account.name}</span>
                                {account.role === 'admin' && (
                                  <span className="px-1.5 py-0.2 bg-[#FAA121]/30 text-[#78350f] text-[10px] rounded font-bold">
                                    Admin
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 bg-[#AFDFB5] text-[#14532d] text-[10px] rounded font-bold">
                                    Active
                                  </span>
                                )}
                                {account.isBanned && (
                                  <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] rounded font-bold">
                                    Banned
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400 truncate font-medium">{account.email}</div>
                            </div>
                          </button>

                          {/* Delete / Remove Account Option */}
                          {!isAdminAccount ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteError(null);
                                setAccountToDelete(account);
                                setDemoDropdownOpen(false);
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-100/70 transition-colors flex-shrink-0 mr-1 opacity-70 hover:opacity-100 cursor-pointer"
                              title={`Delete or remove ${account.name}'s account`}
                              aria-label={`Delete ${account.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-stone-300 flex-shrink-0 mr-1 cursor-not-allowed"
                              title="Platform Administrator is protected"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Account Action */}
                  <div className="pt-2 mt-2 border-t border-[#F0ECC7]">
                    <button
                      type="button"
                      onClick={handleAddNewAccount}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl neo-btn text-xs font-bold text-[#E05504] hover:text-[#c2410c] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-[#E05504]" />
                      <span>Add New Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Auth Buttons or User Pill */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-300/60">
                <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl neo-btn transition-all">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt={user?.name}
                    className="w-7 h-7 rounded-full border border-white shadow-2xs object-cover"
                  />
                  <div className="text-left hidden lg:block">
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block capitalize font-medium">
                      {user?.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl neo-btn transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold rounded-xl neo-btn transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold rounded-xl neo-btn-primary transition-all shadow-sm"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Proper Notification Icon + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationMenu />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 rounded-xl neo-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#F0ECC7] bg-[var(--neo-bg)] px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1.5">
            <Link
              to="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold neo-btn text-slate-700"
            >
              Browse Skills
            </Link>
            {isAuthenticated && (
              <Link
                to="/swaps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold neo-btn text-slate-700"
              >
                <span>My Swaps</span>
                {pendingIncomingCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                    {pendingIncomingCount} pending
                  </span>
                )}
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold neo-btn text-slate-700"
              >
                My Profile
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold neo-btn text-[#E05504]"
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Mobile Switch Account Drawer (Authenticated Only) */}
          {isAuthenticated && (
            <div className="pt-2 border-t border-[#F0ECC7]">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Switch Account
                </span>
                <button
                  type="button"
                  onClick={handleAddNewAccount}
                  className="text-xs font-bold text-[#E05504] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {allSwitchAccounts.map((rawAccount) => {
                  const account = getAccountToDisplay(rawAccount);
                  const isCurrent = user?.email?.toLowerCase() === account.email?.toLowerCase();
                  const isAdminAccount = account.role === 'admin' || account.email === 'patelvedb2403@gmail.com' || account.email === 'admin@skillswap.com';
                  return (
                    <div
                      key={account.id || account.email}
                      className={`p-1.5 text-xs text-left rounded-xl flex items-center justify-between gap-2 transition-all ${
                        isCurrent ? 'neo-inset text-stone-900 font-bold bg-[#AFDFB5]/25 border border-[#AFDFB5]/50' : 'neo-btn text-stone-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleAccountSwitch(account)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 cursor-pointer"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              account.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                account.name || 'user'
                              )}`
                            }
                            alt={account.name}
                            className="w-7 h-7 rounded-full object-cover border border-white shadow-xs"
                          />
                          {isCurrent && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#AFDFB5] border border-stone-800 rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate flex items-center gap-1">
                            <span className="truncate">{account.name}</span>
                            {isCurrent && <span className="text-[9px] text-[#166534] font-bold">(Active)</span>}
                          </div>
                          <span className="text-[10px] text-stone-500 block capitalize">{account.role}</span>
                        </div>
                      </button>

                      {!isAdminAccount ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError(null);
                            setAccountToDelete(account);
                            setMobileMenuOpen(false);
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-100/70 transition-colors flex-shrink-0 cursor-pointer"
                          title={`Delete or remove ${account.name}'s account`}
                          aria-label={`Delete ${account.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-stone-300 flex-shrink-0" title="Protected">
                          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Account Button on Mobile */}
              <button
                type="button"
                onClick={handleAddNewAccount}
                className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl neo-btn text-xs font-bold text-[#E05504] hover:text-[#c2410c] transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#E05504]" />
                <span>Add New Account</span>
              </button>
            </div>
          )}

          {/* Mobile Auth */}
          <div className="pt-2 border-t border-slate-300/40">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full border border-white shadow-xs"
                  />
                  <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 text-xs font-semibold text-rose-600 neo-btn rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-xs font-semibold text-slate-700 neo-btn rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-xs font-semibold text-white neo-btn-primary rounded-xl"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permanent Account Deletion Confirmation Modal (Rendered in document.body via Portal to prevent header clipping) */}
      {accountToDelete && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => {
            if (deletingAccountId === null) {
              setAccountToDelete(null);
              setDeleteError(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md my-auto neo-card p-6 rounded-2xl shadow-2xl border border-rose-200/80 bg-white/95 space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">
                    Delete Account Permanently?
                  </h3>
                  <button
                    type="button"
                    disabled={deletingAccountId !== null}
                    onClick={() => {
                      setAccountToDelete(null);
                      setDeleteError(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  You are about to permanently erase the following user account from the platform:
                </p>
              </div>
            </div>

            {/* Account Card Snippet */}
            <div className="flex items-center gap-3 p-3 rounded-xl neo-inset bg-slate-50/70 border border-slate-200/60">
              <img
                src={
                  accountToDelete.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    accountToDelete.name || 'user'
                  )}`
                }
                alt={accountToDelete.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {accountToDelete.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {accountToDelete.email}
                </div>
                <div className="text-[10px] text-[#E05504] font-semibold capitalize mt-0.5">
                  Role: {accountToDelete.role}
                </div>
              </div>
            </div>

            {/* Warning Details */}
            <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-[11px] text-rose-800 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <span>⚠️ Irreversible Action</span>
              </div>
              <p className="leading-relaxed">
                All associated skills offered & wanted, active skill swaps, reviews & ratings, and personalized notifications will be wiped completely from the database.
              </p>
              {user && (user.id === accountToDelete.id || user.email === accountToDelete.email) && (
                <p className="font-bold text-rose-950 pt-1 border-t border-rose-200/70">
                  Notice: You are currently logged into this account. Deleting it will immediately sign you out.
                </p>
              )}
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingAccountId !== null}
                onClick={() => {
                  setAccountToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl neo-btn text-slate-600 hover:text-slate-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccountId !== null}
                onClick={handleConfirmDeleteAccount}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingAccountId ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;
