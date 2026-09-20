import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { loginWithGooglePopup, logoutFirebase } from '../config/firebase';

const AuthContext = createContext(null);

export const getSavedAccounts = () => {
  try {
    const raw = localStorage.getItem('skillswap_saved_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveAccountToDevice = (userData, tokenToSave) => {
  if (!userData || !userData.email) return;
  try {
    const existing = getSavedAccounts();
    const existingAccount = existing.find(
      (acc) =>
        acc.id === userData.id ||
        acc.email?.toLowerCase() === userData.email?.toLowerCase()
    );

    const updatedAccount = {
      id: userData.id,
      name: userData.name || existingAccount?.name || 'User',
      email: userData.email,
      role: userData.role || existingAccount?.role || 'user',
      avatar: userData.avatar || existingAccount?.avatar,
      token: tokenToSave || existingAccount?.token || null,
      isDemo: !!userData.isDemo,
      isBanned: userData.isBanned !== undefined ? userData.isBanned : existingAccount?.isBanned,
      location: userData.location !== undefined ? userData.location : existingAccount?.location,
      lastUsed: Date.now()
    };

    const filtered = existing.filter(
      (acc) =>
        acc.id !== userData.id &&
        acc.email?.toLowerCase() !== userData.email?.toLowerCase()
    );

    const newSaved = [updatedAccount, ...filtered];
    localStorage.setItem('skillswap_saved_accounts', JSON.stringify(newSaved));
    window.dispatchEvent(new CustomEvent('skillswap:saved-accounts-updated', { detail: newSaved }));
    return newSaved;
  } catch (e) {
    console.error('Error saving account to device:', e);
  }
};

export const removeAccountFromDevice = (accountIdOrEmail) => {
  try {
    const existing = getSavedAccounts();
    const filtered = existing.filter(
      (acc) =>
        acc.id !== accountIdOrEmail &&
        acc.email?.toLowerCase() !== String(accountIdOrEmail).toLowerCase()
    );
    localStorage.setItem('skillswap_saved_accounts', JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('skillswap:saved-accounts-updated', { detail: filtered }));
    return filtered;
  } catch (e) {
    console.error('Error removing account from device:', e);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('skillswap_user') || sessionStorage.getItem('skillswap_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('skillswap_token') || sessionStorage.getItem('skillswap_token') || null;
  });

  const [savedAccounts, setSavedAccounts] = useState(() => getSavedAccounts());
  const [loading, setLoading] = useState(true);
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);

  // Synchronize savedAccounts whenever a device change occurs
  useEffect(() => {
    const handleSavedAccountsUpdate = (event) => {
      setSavedAccounts(event.detail || getSavedAccounts());
    };
    window.addEventListener('skillswap:saved-accounts-updated', handleSavedAccountsUpdate);
    return () => window.removeEventListener('skillswap:saved-accounts-updated', handleSavedAccountsUpdate);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      setPendingIncomingCount(response.data.pendingIncomingCount || 0);

      // Persist to local & session storage
      localStorage.setItem('skillswap_user', JSON.stringify(userData));
      sessionStorage.setItem('skillswap_user', JSON.stringify(userData));

      // Synchronize in savedAccounts list on this device
      saveAccountToDevice(userData, token);
    } catch (error) {
      console.error('Error fetching current user:', error);
      if (error.response && error.response.status === 401) {
        sessionStorage.removeItem('skillswap_token');
        sessionStorage.removeItem('skillswap_user');
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
        setToken(null);
        setUser(null);
        setPendingIncomingCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('skillswap_token', newToken);
    sessionStorage.setItem('skillswap_token', newToken);
    localStorage.setItem('skillswap_user', JSON.stringify(userData));
    sessionStorage.setItem('skillswap_user', JSON.stringify(userData));
    saveAccountToDevice(userData, newToken);
    setToken(newToken);
    setUser(userData);
    await fetchCurrentUser();
    window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    return response.data;
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('skillswap_token', newToken);
    sessionStorage.setItem('skillswap_token', newToken);
    localStorage.setItem('skillswap_user', JSON.stringify(userData));
    sessionStorage.setItem('skillswap_user', JSON.stringify(userData));
    saveAccountToDevice(userData, newToken);
    setToken(newToken);
    setUser(userData);
    await fetchCurrentUser();
    window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    return response.data;
  };

  const demoLogin = async (email) => {
    const response = await api.post('/auth/demo-login', { email });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('skillswap_token', newToken);
    sessionStorage.setItem('skillswap_token', newToken);
    localStorage.setItem('skillswap_user', JSON.stringify(userData));
    sessionStorage.setItem('skillswap_user', JSON.stringify(userData));
    saveAccountToDevice(userData, newToken);
    setToken(newToken);
    setUser(userData);
    await fetchCurrentUser();
    window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    return response.data;
  };

  const loginWithGoogle = async () => {
    // 1. Trigger Firebase Google Popup OAuth
    const result = await loginWithGooglePopup();
    const fbUser = result.user;

    // 2. Synchronize with backend API
    const response = await api.post('/auth/firebase-login', {
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      firebaseUid: fbUser.uid,
      providerId: result.providerId || 'google.com'
    });

    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('skillswap_token', newToken);
    sessionStorage.setItem('skillswap_token', newToken);
    localStorage.setItem('skillswap_user', JSON.stringify(userData));
    sessionStorage.setItem('skillswap_user', JSON.stringify(userData));
    saveAccountToDevice(userData, newToken);
    setToken(newToken);
    setUser(userData);
    await fetchCurrentUser();
    window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    return response.data;
  };

  const switchAccount = async (targetAccount) => {
    if (targetAccount.isDemo || targetAccount.email === 'alex@example.com') {
      return await demoLogin(targetAccount.email);
    }

    const saved = getSavedAccounts();
    const matched = saved.find(
      (acc) =>
        acc.id === targetAccount.id ||
        acc.email?.toLowerCase() === targetAccount.email?.toLowerCase()
    );

    const targetToken = targetAccount.token || matched?.token;

    if (!targetToken) {
      // Redirect to login to authenticate this account
      window.location.href = `/login?email=${encodeURIComponent(targetAccount.email)}&mode=add_account`;
      return;
    }

    localStorage.setItem('skillswap_token', targetToken);
    sessionStorage.setItem('skillswap_token', targetToken);
    setToken(targetToken);

    try {
      const response = await api.get('/auth/me');
      const freshUser = response.data.user;
      setUser(freshUser);
      setPendingIncomingCount(response.data.pendingIncomingCount || 0);
      saveAccountToDevice(freshUser, targetToken);

      // Record account_switch activity
      try {
        await api.post('/auth/record-switch', { accountId: freshUser.id });
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('skillswap:profile-updated'));
      window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
      return freshUser;
    } catch (err) {
      console.warn('Switch account token validation failed:', err);
      window.location.href = `/login?email=${encodeURIComponent(targetAccount.email)}&mode=add_account`;
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      // Ignore Firebase signout error if session was offline
    }

    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      // Silently continue cleanup
    } finally {
      sessionStorage.removeItem('skillswap_token');
      sessionStorage.removeItem('skillswap_user');
      localStorage.removeItem('skillswap_token');
      localStorage.removeItem('skillswap_user');
      setToken(null);
      setUser(null);
      setPendingIncomingCount(0);
      window.dispatchEvent(new CustomEvent('skillswap:activity-updated'));
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('skillswap_user', JSON.stringify(updated));
      sessionStorage.setItem('skillswap_user', JSON.stringify(updated));
      if (token) {
        saveAccountToDevice(updated, token);
      }
      return updated;
    });
    window.dispatchEvent(new CustomEvent('skillswap:profile-updated', { detail: updatedFields }));
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    pendingIncomingCount,
    savedAccounts,
    login,
    loginWithGoogle,
    register,
    demoLogin,
    switchAccount,
    removeSavedAccount: removeAccountFromDevice,
    logout,
    updateUser,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
