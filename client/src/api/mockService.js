// Complete Standalone Mock Service for GitHub Pages / Static Hosting

const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Ved Patel (Administrator)',
    email: 'patelvedb2403@gmail.com',
    role: 'admin',
    location: 'HQ / Global',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Skill Swap platform operations & moderation team.',
    availability: '24/7 Monitoring',
    isPublic: true,
    isBanned: false,
    isDemo: false,
    skillsOffered: [
      { id: 201, title: 'Platform Governance & Systems', category: 'Technology', type: 'offered', proficiency: 'Expert', description: 'System design, code reviews, and community standards architecture.' }
    ],
    skillsWanted: [
      { id: 202, title: 'Advanced Cloud Orchestration', category: 'Technology', type: 'wanted', proficiency: 'Advanced', description: 'Kubernetes multi-cluster management and zero-trust security.' }
    ],
    ratings: []
  },
  {
    id: 2,
    name: 'Alex Rivera',
    email: 'alex@example.com',
    role: 'user',
    location: 'San Francisco, CA',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    bio: 'Full-stack software engineer passionate about modern web apps, TypeScript, and cloud architecture. Looking to learn Spanish and graphic design.',
    availability: 'Weekends & Weekday Evenings',
    isPublic: true,
    isBanned: false,
    isDemo: true,
    skillsOffered: [
      { id: 101, title: 'React 18 & Frontend Architecture', category: 'Technology', type: 'offered', proficiency: 'Advanced', description: 'Modern React patterns, custom hooks, and Tailwind CSS component systems.' },
      { id: 102, title: 'Node.js & Express REST APIs', category: 'Technology', type: 'offered', proficiency: 'Advanced', description: 'Scalable backend design, authentication, and database integration.' }
    ],
    skillsWanted: [
      { id: 103, title: 'Figma UI/UX & Design Systems', category: 'Design', type: 'wanted', proficiency: 'Beginner', description: 'Want to learn design tokens, auto-layout, and prototyping in Figma.' },
      { id: 104, title: 'Conversational Spanish', category: 'Language', type: 'wanted', proficiency: 'Beginner', description: 'Looking for native speaker to practice conversational fluency.' }
    ],
    ratings: [
      { id: 1, rating: 5, feedback: 'Alex was an incredible mentor. Taught me modern React in just 2 sessions!', rater: { id: 3, name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
    ]
  },
  {
    id: 3,
    name: 'Elena Rostova',
    email: 'elena@example.com',
    role: 'user',
    location: 'Austin, TX',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Product Designer & Design Systems lead. 6+ years designing user interfaces in Figma and creating brand identity systems.',
    availability: 'Weekday Evenings (6 PM - 9 PM CST)',
    isPublic: true,
    isBanned: false,
    isDemo: false,
    skillsOffered: [
      { id: 105, title: 'Figma UI/UX Prototyping', category: 'Design', type: 'offered', proficiency: 'Expert', description: 'Comprehensive design workflows, component libraries, and interactive prototypes.' }
    ],
    skillsWanted: [
      { id: 106, title: 'React Basics', category: 'Technology', type: 'wanted', proficiency: 'Beginner', description: 'Want to understand how front-end engineers consume Figma designs in React.' }
    ],
    ratings: []
  },
  {
    id: 4,
    name: 'David Chen',
    email: 'david@example.com',
    role: 'user',
    location: 'Seattle, WA',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Data Analyst & Excel wizard. Master of advanced spreadsheets, SQL dashboards, and automated Python data pipelines.',
    availability: 'Flexible / 10 hrs per week',
    isPublic: true,
    isBanned: false,
    isDemo: false,
    skillsOffered: [
      { id: 107, title: 'Advanced Excel & Power BI', category: 'Data & Analytics', type: 'offered', proficiency: 'Expert', description: 'Power Query, DAX formulas, interactive financial dashboards, and spreadsheet automation.' }
    ],
    skillsWanted: [
      { id: 108, title: 'Python Automation', category: 'Technology', type: 'wanted', proficiency: 'Intermediate', description: 'Looking to automate Excel tasks using pandas and openpyxl.' }
    ],
    ratings: []
  },
  {
    id: 5,
    name: 'Maria Santos',
    email: 'maria@example.com',
    role: 'user',
    location: 'Madrid / Remote',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Native Spanish instructor and acoustic guitar enthusiast. Teaching conversational fluency and fingerstyle guitar technique.',
    availability: 'Saturday Mornings & Sunday Afternoons',
    isPublic: true,
    isBanned: false,
    isDemo: false,
    skillsOffered: [
      { id: 109, title: 'Conversational Spanish', category: 'Language', type: 'offered', proficiency: 'Expert', description: 'Practical Spanish conversation for travel, business, or daily life.' },
      { id: 110, title: 'Acoustic Guitar Lessons', category: 'Music & Arts', type: 'offered', proficiency: 'Advanced', description: 'Fingerstyle technique, chord transitions, and musical theory basics.' }
    ],
    skillsWanted: [
      { id: 111, title: 'Web Development Basics', category: 'Technology', type: 'wanted', proficiency: 'Beginner', description: 'Want to build my own portfolio website.' }
    ],
    ratings: []
  }
];

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem('skillswap_mock_' + key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem('skillswap_mock_' + key, JSON.stringify(val));
  } catch (e) {}
}

export function initMockStorage() {
  if (!localStorage.getItem('skillswap_mock_users')) {
    setStored('users', DEFAULT_USERS);
  }
  if (!localStorage.getItem('skillswap_mock_swaps')) {
    setStored('swaps', [
      {
        id: 1,
        requesterId: 2,
        recipientId: 3,
        offeredSkillId: 101,
        wantedSkillId: 105,
        status: 'accepted',
        proposalNote: 'Excited to swap React fundamentals for Figma design system mentorship!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        requester: DEFAULT_USERS[1],
        recipient: DEFAULT_USERS[2],
        offeredSkill: DEFAULT_USERS[1].skillsOffered[0],
        wantedSkill: DEFAULT_USERS[2].skillsOffered[0],
        ratings: []
      },
      {
        id: 2,
        requesterId: 4,
        recipientId: 2,
        offeredSkillId: 107,
        wantedSkillId: 102,
        status: 'pending',
        proposalNote: 'Hi Alex, I would love to learn Node.js in exchange for Power BI dashboards!',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        requester: DEFAULT_USERS[3],
        recipient: DEFAULT_USERS[1],
        offeredSkill: DEFAULT_USERS[3].skillsOffered[0],
        wantedSkill: DEFAULT_USERS[1].skillsOffered[1],
        ratings: []
      }
    ]);
  }
  if (!localStorage.getItem('skillswap_mock_broadcasts')) {
    setStored('broadcasts', [
      {
        id: 1,
        title: 'Welcome to Skill Swap!',
        message: 'Explore peer skills, propose swaps, and connect with fellow creators worldwide.',
        type: 'info',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]);
  }
  if (!localStorage.getItem('skillswap_mock_notifications')) {
    setStored('notifications', [
      {
        id: 1,
        userId: 2,
        title: 'New Swap Proposal 📬',
        message: 'David Chen sent you a skill swap request for Node.js & Express REST APIs.',
        type: 'swap_request',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 2,
        userId: 1,
        title: 'Platform System Alert 🛡️',
        message: 'Welcome Ved Patel! Platform systems and audit monitors are active.',
        type: 'welcome',
        link: '/admin',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 3,
        userId: 3,
        title: 'Swap Request Accepted 🎉',
        message: 'Alex Rivera accepted your design system mentoring session!',
        type: 'swap_accepted',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ]);
  }
}

initMockStorage();

export async function handleMockRequest(config) {
  const url = (config.url || '').replace(/^\/api/, '');
  const method = (config.method || 'get').toLowerCase();
  let body = {};
  try {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
  } catch (e) {}

  const users = getStored('users', DEFAULT_USERS);
  const swaps = getStored('swaps', []);
  const broadcasts = getStored('broadcasts', []);
  const notifications = getStored('notifications', []);

  // Resolve current user from Authorization header or stored session
  let currentUser = null;
  const authHeader = config.headers?.Authorization || config.headers?.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const tokenStr = authHeader.replace('Bearer ', '').trim();
    const match = tokenStr.match(/^(?:demo_|fb_)?token_([^_]+)_/);
    if (match) {
      const tokenUid = match[1];
      currentUser = users.find(u => String(u.id) === String(tokenUid));
    }
  }
  if (!currentUser) {
    const storedUserRaw = localStorage.getItem('skillswap_user') || sessionStorage.getItem('skillswap_user');
    if (storedUserRaw) {
      try {
        currentUser = JSON.parse(storedUserRaw);
      } catch (e) {}
    }
  }
  if (!currentUser) {
    currentUser = users[1]; // fallback to Alex Rivera
  }

  // Helper to package response
  const ok = (data, status = 200) => ({ status, data });

  // 1. GET /auth/demo-accounts
  if (url.includes('/auth/demo-accounts')) {
    return ok(users);
  }

  // 2. POST /auth/demo-login
  if (url.includes('/auth/demo-login')) {
    const targetEmail = (body.email || 'alex@example.com').toLowerCase();
    const demo = users.find(u => u.email.toLowerCase() === targetEmail) || users[1];
    const token = 'demo_token_' + demo.id + '_' + Date.now();
    localStorage.setItem('skillswap_user', JSON.stringify(demo));
    sessionStorage.setItem('skillswap_user', JSON.stringify(demo));
    localStorage.setItem('skillswap_token', token);
    sessionStorage.setItem('skillswap_token', token);
    return ok({
      token,
      user: demo
    });
  }

  // 3. POST /auth/login
  if (url.includes('/auth/login')) {
    const email = (body.email || '').toLowerCase().trim();
    const isAdmin = email === 'patelvedb2403@gmail.com';
    let found = users.find(u => u.email.toLowerCase() === email);
    if (!found) {
      found = {
        id: Date.now(),
        name: isAdmin ? 'Ved Patel (Administrator)' : (email.split('@')[0] || 'User'),
        email: email,
        role: isAdmin ? 'admin' : 'user',
        location: 'Remote',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
        bio: 'Skill enthusiast and learner.',
        availability: 'Evenings & Weekends',
        isPublic: true,
        isBanned: false,
        isDemo: false,
        skillsOffered: [],
        skillsWanted: [],
        ratings: []
      };
      users.push(found);
      setStored('users', users);
    }
    return ok({
      token: 'token_' + found.id + '_' + Date.now(),
      user: found
    });
  }

  // 4. POST /auth/register
  if (url.includes('/auth/register')) {
    const email = (body.email || '').toLowerCase().trim();
    const isAdmin = email === 'patelvedb2403@gmail.com';
    const newUser = {
      id: Date.now(),
      name: body.name || email.split('@')[0] || 'User',
      email: email,
      role: isAdmin ? 'admin' : 'user',
      location: body.location || 'Remote',
      avatar: body.avatar || ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + email),
      bio: body.bio || 'New member on Skill Swap.',
      availability: body.availability || 'Flexible',
      isPublic: body.isPublic !== false,
      isBanned: false,
      isDemo: false,
      skillsOffered: [],
      skillsWanted: [],
      ratings: []
    };
    const updated = [newUser, ...users.filter(u => u.email.toLowerCase() !== email)];
    setStored('users', updated);
    return ok({
      token: 'token_' + newUser.id + '_' + Date.now(),
      user: newUser
    }, 201);
  }

  // 5. POST /auth/firebase-login
  if (url.includes('/auth/firebase-login')) {
    const email = (body.email || '').toLowerCase().trim();
    const isAdmin = email === 'patelvedb2403@gmail.com';
    let found = users.find(u => u.email.toLowerCase() === email);
    if (!found) {
      found = {
        id: body.firebaseUid || Date.now(),
        name: body.displayName || email.split('@')[0] || 'User',
        email: email,
        role: isAdmin ? 'admin' : 'user',
        location: 'Remote',
        avatar: body.photoURL || ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + email),
        bio: 'Google authenticated member.',
        availability: 'Flexible',
        isPublic: true,
        isBanned: false,
        isDemo: false,
        skillsOffered: [],
        skillsWanted: [],
        ratings: []
      };
      users.push(found);
      setStored('users', users);
    }
    return ok({
      token: 'fb_token_' + found.id + '_' + Date.now(),
      user: found
    });
  }

  // 6. GET /auth/me
  if (url.includes('/auth/me')) {
    const target = users.find(u => String(u.id) === String(currentUser.id) || u.email?.toLowerCase() === currentUser.email?.toLowerCase()) || currentUser;
    const allUserSkills = [
      ...(target.skillsOffered || []),
      ...(target.skillsWanted || [])
    ];
    const pendingCount = swaps.filter(s => String(s.recipientId) === String(target.id) && s.status === 'pending').length;
    return ok({
      user: target,
      skills: allUserSkills,
      pendingIncomingCount: pendingCount
    });
  }

  // 7. POST /auth/record-switch, /auth/logout
  if (url.includes('/auth/record-switch')) {
    const targetUid = body.accountId || (currentUser ? currentUser.id : null);
    const targetUser = users.find(u => String(u.id) === String(targetUid) || u.email?.toLowerCase() === currentUser.email?.toLowerCase()) || currentUser;
    if (targetUser) {
      notifications.unshift({
        id: Date.now(),
        userId: targetUser.id,
        title: 'Switched into Account (Active Session) 🔄',
        message: `Active session switched into ${targetUser.name}'s account.`,
        type: 'account_switch',
        link: '/profile',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      setStored('notifications', notifications);
    }
    return ok({ success: true });
  }
  if (url.includes('/auth/logout')) {
    return ok({ success: true });
  }

  // 8. GET /skills
  if (url.startsWith('/skills') && method === 'get') {
    let allSkills = [];
    users.forEach(u => {
      if (u.isBanned) return;
      (u.skillsOffered || []).forEach(s => {
        allSkills.push({
          ...s,
          type: 'offered',
          user: { id: u.id, name: u.name, avatar: u.avatar, location: u.location, rating: 4.9, isPublic: u.isPublic }
        });
      });
      (u.skillsWanted || []).forEach(s => {
        allSkills.push({
          ...s,
          type: 'wanted',
          user: { id: u.id, name: u.name, avatar: u.avatar, location: u.location, rating: 4.9, isPublic: u.isPublic }
        });
      });
    });

    let filtered = allSkills;
    try {
      const qIndex = url.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(url.substring(qIndex));
        const search = params.get('search');
        const category = params.get('category');
        const type = params.get('type');
        const proficiency = params.get('proficiency');

        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(s => (s.title && s.title.toLowerCase().includes(q)) || (s.description && s.description.toLowerCase().includes(q)));
        }
        if (category && category !== 'All') {
          filtered = filtered.filter(s => s.category && s.category.toLowerCase() === category.toLowerCase());
        }
        if (type && type !== 'all') {
          filtered = filtered.filter(s => s.type === type);
        }
        if (proficiency && proficiency !== 'All') {
          filtered = filtered.filter(s => s.proficiency && s.proficiency.toLowerCase() === proficiency.toLowerCase());
        }
      }
    } catch (e) {}

    return ok(filtered);
  }

  // 9. POST /skills
  if (url === '/skills' && method === 'post') {
    const user = users.find(u => String(u.id) === String(currentUser.id) || u.email?.toLowerCase() === currentUser.email?.toLowerCase()) || currentUser;
    const newSkill = {
      id: Date.now(),
      userId: user.id,
      title: (body.title || 'New Skill').trim(),
      category: body.category || 'Programming',
      type: body.type || 'offered',
      proficiency: body.proficiency || 'Intermediate',
      description: (body.description || '').trim(),
      createdAt: new Date().toISOString()
    };
    if (newSkill.type === 'offered') {
      user.skillsOffered = user.skillsOffered || [];
      const filtered = user.skillsOffered.filter(s => s.title.toLowerCase() !== newSkill.title.toLowerCase());
      user.skillsOffered = [newSkill, ...filtered];
    } else {
      user.skillsWanted = user.skillsWanted || [];
      const filtered = user.skillsWanted.filter(s => s.title.toLowerCase() !== newSkill.title.toLowerCase());
      user.skillsWanted = [newSkill, ...filtered];
    }
    setStored('users', users);
    try {
      localStorage.setItem('skillswap_user', JSON.stringify(user));
      sessionStorage.setItem('skillswap_user', JSON.stringify(user));
    } catch (e) {}

    // Add activity notification for adding this skill
    notifications.unshift({
      id: Date.now(),
      userId: user.id,
      title: `Skill Added: ${newSkill.title}`,
      message: `You added "${newSkill.title}" (${newSkill.category} • ${newSkill.proficiency}) to your ${newSkill.type === 'offered' ? 'Skills Offered' : 'Skills Wanted'}.`,
      type: 'skill_created',
      link: '/profile',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    setStored('notifications', notifications);

    return ok({ message: 'Skill added successfully!', skill: newSkill, ...newSkill }, 201);
  }

  // 10. PUT /skills/:id
  if (url.startsWith('/skills/') && method === 'put') {
    const skillId = parseInt(url.split('/')[2]);
    const user = users.find(u => String(u.id) === String(currentUser.id) || u.email?.toLowerCase() === currentUser.email?.toLowerCase()) || currentUser;
    let updatedItem = null;
    if (user) {
      ['skillsOffered', 'skillsWanted'].forEach(listKey => {
        const item = (user[listKey] || []).find(s => s.id === skillId);
        if (item) {
          Object.assign(item, body);
          updatedItem = item;
        }
      });
      setStored('users', users);
      try {
        localStorage.setItem('skillswap_user', JSON.stringify(user));
        sessionStorage.setItem('skillswap_user', JSON.stringify(user));
      } catch (e) {}
    }
    return ok({ success: true, id: skillId, skill: updatedItem });
  }

  // 11. DELETE /skills/:id
  if (url.startsWith('/skills/') && method === 'delete') {
    const skillId = parseInt(url.split('/')[2]);
    const user = users.find(u => String(u.id) === String(currentUser.id) || u.email?.toLowerCase() === currentUser.email?.toLowerCase()) || currentUser;
    if (user) {
      user.skillsOffered = (user.skillsOffered || []).filter(s => s.id !== skillId);
      user.skillsWanted = (user.skillsWanted || []).filter(s => s.id !== skillId);
      setStored('users', users);
      try {
        localStorage.setItem('skillswap_user', JSON.stringify(user));
        sessionStorage.setItem('skillswap_user', JSON.stringify(user));
      } catch (e) {}
    }
    return ok({ success: true });
  }

  // 12. GET /swaps/my-swaps and /swaps
  if (url.includes('/swaps') && method === 'get') {
    const uid = currentUser.id;
    const allUserSwaps = swaps.filter(s => s.requesterId === uid || s.recipientId === uid);
    const incomingPending = allUserSwaps.filter(s => s.recipientId === uid && s.status === 'pending');
    const outgoingPending = allUserSwaps.filter(s => s.requesterId === uid && s.status === 'pending');
    const active = allUserSwaps.filter(s => s.status === 'accepted');
    const completed = allUserSwaps.filter(s => s.status === 'completed');
    const past = allUserSwaps.filter(s => s.status === 'rejected' || s.status === 'cancelled');

    return ok({
      all: allUserSwaps,
      incomingPending,
      outgoingPending,
      active,
      completed,
      past,
      counts: {
        total: allUserSwaps.length,
        incomingPending: incomingPending.length,
        outgoingPending: outgoingPending.length,
        active: active.length,
        completed: completed.length
      }
    });
  }

  // 13. POST /swaps
  if (url === '/swaps' && method === 'post') {
    const requester = users.find(u => u.id === currentUser.id) || currentUser;
    const recipient = users.find(u => u.id === body.recipientId) || users[2];
    const offered = (requester.skillsOffered || []).find(s => s.id === body.offeredSkillId) || { id: body.offeredSkillId, title: 'Offered Skill' };
    const wanted = (recipient.skillsOffered || []).find(s => s.id === body.wantedSkillId) || { id: body.wantedSkillId, title: 'Wanted Skill' };

    const newSwap = {
      id: Date.now(),
      requesterId: requester.id,
      recipientId: recipient.id,
      offeredSkillId: body.offeredSkillId,
      wantedSkillId: body.wantedSkillId,
      status: 'pending',
      proposalNote: body.message || body.proposalNote || '',
      createdAt: new Date().toISOString(),
      requester: { id: requester.id, name: requester.name, avatar: requester.avatar, location: requester.location },
      recipient: { id: recipient.id, name: recipient.name, avatar: recipient.avatar, location: recipient.location },
      offeredSkill: offered,
      wantedSkill: wanted,
      ratings: []
    };
    swaps.unshift(newSwap);
    setStored('swaps', swaps);

    notifications.unshift({
      id: Date.now(),
      userId: recipient.id,
      title: 'New Swap Proposal 📬',
      message: (requester.name || 'A user') + ' wants to swap skills with you!',
      type: 'swap_request',
      link: '/swaps',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    setStored('notifications', notifications);

    return ok(newSwap, 201);
  }

  // 14. PUT /swaps/:id/:action
  if (url.startsWith('/swaps/') && method === 'put') {
    const parts = url.split('/');
    const swapId = parseInt(parts[2]);
    const action = parts[3];
    const s = swaps.find(x => x.id === swapId);
    if (s) {
      if (action === 'accept') s.status = 'accepted';
      if (action === 'reject') s.status = 'rejected';
      if (action === 'complete') s.status = 'completed';
      setStored('swaps', swaps);
      return ok(s);
    }
  }

  // 15. DELETE /swaps/:id
  if (url.startsWith('/swaps/') && method === 'delete') {
    const swapId = parseInt(url.split('/')[2]);
    const updated = swaps.filter(x => x.id !== swapId);
    setStored('swaps', updated);
    return ok({ success: true });
  }

  // 16. POST /ratings
  if (url.includes('/ratings') && method === 'post') {
    const swap = swaps.find(s => s.id === body.swapId);
    const newRating = {
      id: Date.now(),
      rating: body.rating || 5,
      feedback: body.feedback || '',
      rater: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
      createdAt: new Date().toISOString()
    };
    if (swap) {
      swap.ratings = swap.ratings || [];
      swap.ratings.push(newRating);
      setStored('swaps', swaps);
    }
    return ok(newRating, 201);
  }

  // 17. GET /users/:id
  if (url.startsWith('/users/') && method === 'get') {
    const parts = url.split('/');
    const id = parseInt(parts[2]);
    const target = users.find(u => u.id === id) || users[1];
    return ok(target);
  }

  // 18. PUT /users/profile
  if (url.includes('/users/profile') && method === 'put') {
    const target = users.find(u => u.id === currentUser.id);
    if (target) {
      Object.assign(target, body);
      setStored('users', users);
      localStorage.setItem('skillswap_user', JSON.stringify(target));
      sessionStorage.setItem('skillswap_user', JSON.stringify(target));
      return ok({ success: true, user: target });
    }
    return ok({ success: true, user: currentUser });
  }

  // 19. DELETE /users/:id
  if (url.startsWith('/users/') && method === 'delete') {
    const id = parseInt(url.split('/')[2]);
    const updated = users.filter(u => u.id !== id);
    setStored('users', updated);
    return ok({ success: true });
  }

  // 20. GET /admin/broadcasts/active or /broadcasts
  if (url.includes('broadcasts/active') || url === '/broadcasts/active') {
    const active = broadcasts.find(b => b.isActive) || null;
    return ok(active);
  }

  // 21. Admin suite endpoints
  if (url.includes('/admin/stats')) {
    let totalSkills = 0;
    users.forEach(u => {
      totalSkills += (u.skillsOffered || []).length + (u.skillsWanted || []).length;
    });
    return ok({
      totalUsers: users.length,
      activeSkills: totalSkills,
      pendingSwaps: swaps.filter(s => s.status === 'pending').length,
      activeSwaps: swaps.filter(s => s.status === 'accepted').length,
      completedSwaps: swaps.filter(s => s.status === 'completed').length,
      totalReviews: 8
    });
  }
  if (url.includes('/admin/users')) {
    return ok(users);
  }
  if (url.includes('/admin/skills')) {
    let list = [];
    users.forEach(u => {
      (u.skillsOffered || []).forEach(s => list.push({ ...s, user: u }));
      (u.skillsWanted || []).forEach(s => list.push({ ...s, user: u }));
    });
    return ok(list);
  }
  if (url.includes('/admin/swaps')) {
    return ok(swaps);
  }
  if (url.includes('/admin/broadcasts') && method === 'get') {
    return ok(broadcasts);
  }
  if (url.includes('/admin/broadcasts') && method === 'post') {
    const newB = {
      id: Date.now(),
      title: body.title,
      message: body.message,
      type: body.type || 'info',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    broadcasts.unshift(newB);
    setStored('broadcasts', broadcasts);
    return ok(newB, 201);
  }
  if (url.includes('/admin/broadcasts/') && url.includes('/toggle')) {
    const bId = parseInt(url.split('/')[3]);
    const b = broadcasts.find(x => x.id === bId);
    if (b) b.isActive = !b.isActive;
    setStored('broadcasts', broadcasts);
    return ok(b);
  }
  if (url.includes('/admin/broadcasts/') && method === 'delete') {
    const bId = parseInt(url.split('/')[3]);
    const rem = broadcasts.filter(x => x.id !== bId);
    setStored('broadcasts', rem);
    return ok({ success: true });
  }
  if (url.includes('/admin/reports')) {
    return ok("id,name,email,role,status\n1,Ved Patel,patelvedb2403@gmail.com,admin,active\n2,Alex Rivera,alex@example.com,user,active\n");
  }
  if (url.includes('/admin/users/') && url.includes('/ban')) {
    const uid = parseInt(url.split('/')[3]);
    const u = users.find(x => x.id === uid);
    if (u) u.isBanned = !u.isBanned;
    setStored('users', users);
    return ok(u);
  }

  // 22. Notifications
  if (url.startsWith('/notifications') && method === 'get') {
    const uid = currentUser ? currentUser.id : null;
    let userNotifs = notifications.filter(n => !n.userId || String(n.userId) === String(uid));

    // If no notifications yet for this user, provide a welcome notification
    if (userNotifs.length === 0 && currentUser) {
      const welcome = {
        id: Date.now(),
        userId: currentUser.id,
        title: `Welcome, ${currentUser.name}! 🎉`,
        message: 'Your Skill Swap account is active! Propose swaps, share skills, and connect with peers.',
        type: 'welcome',
        link: '/browse',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      notifications.unshift(welcome);
      setStored('notifications', notifications);
      userNotifs = [welcome];
    }
    const unread = userNotifs.filter(n => !n.isRead).length;
    return ok({ notifications: userNotifs, unreadCount: unread });
  }

  if (url.includes('/notifications/read-all') && (method === 'put' || method === 'post')) {
    const uid = currentUser ? currentUser.id : null;
    notifications.forEach(n => {
      if (!n.userId || String(n.userId) === String(uid)) {
        n.isRead = true;
      }
    });
    setStored('notifications', notifications);
    return ok({ success: true, message: 'All notifications marked as read.' });
  }

  if (url.match(/\/notifications\/[^/]+\/read/) && (method === 'put' || method === 'post')) {
    const notifId = parseInt(url.split('/')[2]);
    const target = notifications.find(n => n.id === notifId);
    if (target) {
      target.isRead = true;
      setStored('notifications', notifications);
    }
    return ok({ success: true, notification: target });
  }

  if (url.startsWith('/notifications/') && method === 'delete') {
    const notifId = parseInt(url.split('/')[2]);
    const updated = notifications.filter(n => n.id !== notifId);
    setStored('notifications', updated);
    return ok({ success: true, message: 'Notification dismissed.' });
  }

  if (url === '/notifications' && method === 'delete') {
    const uid = currentUser ? currentUser.id : null;
    const remaining = notifications.filter(n => n.userId && String(n.userId) !== String(uid));
    setStored('notifications', remaining);
    return ok({ success: true, message: 'Notifications cleared.' });
  }

  // Default fallback
  return ok({});
}
