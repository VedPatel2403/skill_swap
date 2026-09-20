const jwt = require('jsonwebtoken');
const { User, Skill, Swap, Notification } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

const ADMIN_EMAIL = 'patelvedb2403@gmail.com';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, location, avatar, bio, availability, isPublic } = req.body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const isTargetAdmin = trimmedEmail === ADMIN_EMAIL.toLowerCase();

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: isTargetAdmin ? 'admin' : 'user',
      location: location ? location.trim() : null,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
      bio: bio ? bio.trim() : '',
      availability: availability || 'Flexible / Weekends',
      isPublic: isPublic !== undefined ? isPublic : true,
      isBanned: false,
      isDemo: req.body.isDemo !== undefined ? !!req.body.isDemo : false
    });

    // Record account creation activity in user's account
    try {
      await Notification.create({
        userId: user.id,
        type: 'account_created',
        title: 'Account Created Successfully 🎉',
        message: `Welcome to Skill Swap, ${user.name}! Your account has been registered and initialized.`,
        link: '/profile',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording account creation activity:', notifErr);
    }

    const token = generateToken(user);
    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({
        error: 'This account has been suspended for violating platform policies.',
        isBanned: true
      });
    }

    // Role assignment: Only patelvedb2403@gmail.com becomes admin when logged in
    const isTargetAdmin = trimmedEmail === ADMIN_EMAIL.toLowerCase();
    if (isTargetAdmin) {
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
    } else {
      if (user.role === 'admin' && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        user.role = 'user';
        await user.save();
      }
    }

    const token = generateToken(user);

    // Record login activity in user's account
    try {
      await Notification.create({
        userId: user.id,
        type: 'auth_login',
        title: 'Account Login',
        message: 'You successfully signed into your account session.',
        link: '/profile',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording login activity:', notifErr);
    }

    res.json({
      message: 'Login successful!',
      token,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Skill, as: 'skills' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Role guarantee: patelvedb2403@gmail.com is admin when logged in
    const isTargetAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isTargetAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    } else if (!isTargetAdmin && user.role === 'admin' && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      user.role = 'user';
      await user.save();
    }

    // Get counts
    const pendingIncoming = await Swap.count({
      where: { recipientId: user.id, status: 'pending' }
    });

    const pendingOutgoing = await Swap.count({
      where: { requesterId: user.id, status: 'pending' }
    });

    const seenSkills = new Set();
    const uniqueSkills = (user.skills || []).filter(s => {
      const key = `${s.type}::${(s.title || '').trim().toLowerCase()}`;
      if (seenSkills.has(key)) return false;
      seenSkills.add(key);
      return true;
    });

    res.json({
      user: user.toSafeJSON(),
      skills: uniqueSkills,
      pendingIncomingCount: pendingIncoming,
      pendingOutgoingCount: pendingOutgoing
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
};

exports.getDemoAccounts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const currentUserId = req.user ? req.user.id : null;
    const { Op } = require('sequelize');

    const orConditions = [{ isDemo: true }];
    if (currentUserId) {
      orConditions.push({ id: currentUserId });
    }

    if (req.query.ids) {
      const ids = req.query.ids
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        orConditions.push({ id: { [Op.in]: ids } });
      }
    }

    const users = await User.findAll({
      where: { [Op.or]: orConditions },
      attributes: ['id', 'name', 'email', 'role', 'avatar', 'location', 'isBanned', 'availability', 'isDemo'],
      order: [['role', 'ASC'], ['name', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching demo accounts:', error);
    res.status(500).json({ error: 'Failed to load demo accounts.' });
  }
};

exports.recordSwitch = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.body.accountId;
    if (!userId) {
      return res.status(400).json({ error: 'Account ID is required.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await Notification.create({
      userId: user.id,
      type: 'account_switch',
      title: 'Switched into Account (Active Session)',
      message: `Switched into ${user.name}'s account via Switch Account drawer.`,
      link: '/profile',
      isRead: false
    });

    res.json({ success: true, message: `Switch activity recorded for ${user.name}` });
  } catch (error) {
    console.error('Record switch error:', error);
    res.status(500).json({ error: 'Failed to record switch activity.' });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({ error: 'Email is required for demo login.' });
    }

    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Demo user not found.' });
    }

    // Security check: Only demo accounts or self-switching can use demoLogin
    // Real registered users must sign in with their password / Google login to protect account data
    const currentUserId = req.user ? req.user.id : null;

    if (!user.isDemo && user.id !== currentUserId) {
      return res.status(403).json({
        error: 'This is a personal registered account. Passwordless switch is disabled to protect user data from other screens. Please sign in with your credentials.',
        isDemoOnly: true
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        error: 'This account has been suspended for violating platform policies.',
        isBanned: true
      });
    }

    const token = generateToken(user);

    // Record switch account activity in user's account
    try {
      await Notification.create({
        userId: user.id,
        type: 'account_switch',
        title: 'Switched into Account (Active Session)',
        message: `Switched into ${user.name}'s account via Switch Account drawer.`,
        link: '/profile',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording switch activity:', notifErr);
    }

    res.json({
      message: `Logged in as ${user.name}`,
      token,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to login with demo account.' });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.create({
      userId,
      type: 'auth_logout',
      title: 'Account Logout',
      message: 'You safely signed out of your account session.',
      link: '/login',
      isRead: true
    });
    res.json({ message: 'Session signed out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to record logout.' });
  }
};

exports.firebaseLogin = async (req, res) => {
  try {
    const { email, name, displayName, avatar, photoURL, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Firebase authentication.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const effectiveAvatar = photoURL || avatar || null;
    const effectiveName = (displayName || name || '').trim();

    const isTargetAdmin = trimmedEmail === ADMIN_EMAIL.toLowerCase();

    let user = await User.findOne({ where: { email: trimmedEmail } });

    if (user) {
      // If user exists, verify if banned
      if (user.isBanned) {
        return res.status(403).json({
          error: 'This account has been suspended for violating platform policies.',
          isBanned: true
        });
      }

      // Role assignment: Only patelvedb2403@gmail.com becomes admin when logged in
      if (isTargetAdmin) {
        if (user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
      } else {
        if (user.role === 'admin' && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          user.role = 'user';
          await user.save();
        }
      }

      // Update avatar if provided by Google and currently empty/default
      if (effectiveAvatar && (!user.avatar || user.avatar.includes('dicebear.com'))) {
        user.avatar = effectiveAvatar;
        await user.save();
      }
    } else {
      // New user registering through Firebase / Google
      const crypto = require('crypto');
      const tempPassword = crypto.randomBytes(24).toString('hex');
      const finalName = effectiveName || trimmedEmail.split('@')[0];

      user = await User.create({
        name: finalName,
        email: trimmedEmail,
        password: tempPassword,
        role: isTargetAdmin ? 'admin' : 'user',
        avatar: effectiveAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalName)}`,
        bio: 'Joined via Google / Firebase Authentication',
        availability: 'Flexible / Weekends',
        isPublic: true,
        isBanned: false,
        isDemo: false
      });

      // Record welcome notification
      try {
        await Notification.create({
          userId: user.id,
          type: 'account_created',
          title: 'Welcome to Skill Swap! 🎉',
          message: `Welcome ${user.name}! Your account has been initialized via Google / Firebase Authentication.`,
          link: '/profile',
          isRead: false
        });
      } catch (notifErr) {
        console.error('Error recording firebase account creation activity:', notifErr);
      }
    }

    // Record login activity
    try {
      await Notification.create({
        userId: user.id,
        type: 'auth_login',
        title: 'Google Account Login',
        message: 'You successfully signed into your account via Google Authentication.',
        link: '/profile',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording login activity:', notifErr);
    }

    const token = generateToken(user);
    res.json({
      message: `Signed in as ${user.name}`,
      token,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Firebase.' });
  }
};
