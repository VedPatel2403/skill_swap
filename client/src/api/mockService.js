// Mock Service for standalone client execution (e.g. GitHub Pages static hosting)

const SEED_USERS = [
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
    skillsOffered: [],
    skillsWanted: []
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
      { id: 105, title: 'Figma UI/UX Prototyping', category: 'Design', type: 'offered', proficiency: 'Expert', description: 'Comprehensive design workflows, component libraries, and interactive interactive prototypes.' }
    ],
    skillsWanted: [
      { id: 106, title: 'React Basics', category: 'Technology', type: 'wanted', proficiency: 'Beginner', description: 'Want to understand how front-end engineers consume Figma designs in React.' }
    ]
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
    ]
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
    ]
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
    setStored('users', SEED_USERS);
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
        requester: SEED_USERS[1],
        recipient: SEED_USERS[2],
        offeredSkill: SEED_USERS[1].skillsOffered[0],
        wantedSkill: SEED_USERS[2].skillsOffered[0]
      }
    ]);
  }
}

initMockStorage();

export async function handleMockRequest(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  let body = {};
  try {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
  } catch (e) {}

  const users = getStored('users', SEED_USERS);
  const swaps = getStored('swaps', []);

  // Current user from token
  const token = localStorage.getItem('skillswap_token') || sessionStorage.getItem('skillswap_token');
  const storedUserRaw = localStorage.getItem('skillswap_user') || sessionStorage.getItem('skillswap_user');
  const currentUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  // 1. GET /auth/demo-accounts
  if (url.includes('/auth/demo-accounts')) {
    const demo = users.find(u => u.isDemo || u.email === 'alex@example.com') || users[1];
    return { status: 200, data: [demo] };
  }

  // 2. POST /auth/demo-login
  if (url.includes('/auth/demo-login')) {
    const demo = users.find(u => u.isDemo || u.email === (body.email || 'alex@example.com')) || users[1];
    return {
      status: 200,
      data: {
        token: 'mock_token_' + demo.id + '_' + Date.now(),
        user: demo
      }
    };
  }

  // 3. POST /auth/login
  if (url.includes('/auth/login')) {
    const email = (body.email || '').toLowerCase().trim();
    let found = users.find(u => u.email.toLowerCase() === email);
    if (!found) {
      // Allow seamless login as admin or newly entered user
      const isAdmin = email === 'patelvedb2403@gmail.com';
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
        skillsWanted: []
      };
      users.push(found);
      setStored('users', users);
    }
    return {
      status: 200,
      data: {
        token: 'mock_token_' + found.id + '_' + Date.now(),
        user: found
      }
    };
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
      skillsWanted: []
    };
    const updated = [newUser, ...users.filter(u => u.email.toLowerCase() !== email)];
    setStored('users', updated);
    return {
      status: 201,
      data: {
        token: 'mock_token_' + newUser.id + '_' + Date.now(),
        user: newUser
      }
    };
  }

  // 5. POST /auth/firebase-login
  if (url.includes('/auth/firebase-login')) {
    const email = (body.email || '').toLowerCase().trim();
    const isAdmin = email === 'patelvedb2403@gmail.com';
    let user = users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      user = {
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
        skillsWanted: []
      };
      users.push(user);
      setStored('users', users);
    }
    return {
      status: 200,
      data: {
        token: 'mock_fb_' + user.id + '_' + Date.now(),
        user: user
      }
    };
  }

  // 6. GET /auth/me
  if (url.includes('/auth/me')) {
    if (!currentUser) {
      return { status: 401, data: { error: 'Not authenticated' } };
    }
    return {
      status: 200,
      data: {
        user: currentUser,
        pendingIncomingCount: swaps.filter(s => s.recipientId === currentUser.id && s.status === 'pending').length
      }
    };
  }

  // 7. GET /skills
  if (url.includes('/skills') && method === 'get') {
    let allSkills = [];
    users.forEach(u => {
      (u.skillsOffered || []).forEach(s => {
        allSkills.push({ ...s, user: { id: u.id, name: u.name, avatar: u.avatar, location: u.location, rating: 4.9, isPublic: u.isPublic } });
      });
      (u.skillsWanted || []).forEach(s => {
        allSkills.push({ ...s, user: { id: u.id, name: u.name, avatar: u.avatar, location: u.location, rating: 4.9, isPublic: u.isPublic } });
      });
    });

    const parsedUrl = new URL('http://dummy.com' + (url.startsWith('/') ? url : '/' + url));
    const search = parsedUrl.searchParams.get('search');
    const category = parsedUrl.searchParams.get('category');
    const type = parsedUrl.searchParams.get('type');
    const proficiency = parsedUrl.searchParams.get('proficiency');

    let filtered = allSkills;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));
    }
    if (category && category !== 'All') {
      filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    if (type && type !== 'all') {
      filtered = filtered.filter(s => s.type.toLowerCase() === type.toLowerCase());
    }
    if (proficiency && proficiency !== 'All') {
      filtered = filtered.filter(s => s.proficiency.toLowerCase() === proficiency.toLowerCase());
    }

    return { status: 200, data: filtered };
  }

  // 8. GET /swaps
  if (url.includes('/swaps') && method === 'get') {
    const uid = currentUser?.id;
    const userSwaps = swaps.filter(s => s.requesterId === uid || s.recipientId === uid);
    return { status: 200, data: userSwaps };
  }

  // 9. POST /swaps
  if (url.includes('/swaps') && method === 'post') {
    const newSwap = {
      id: Date.now(),
      requesterId: currentUser?.id || 2,
      recipientId: body.recipientId,
      offeredSkillId: body.offeredSkillId,
      wantedSkillId: body.wantedSkillId,
      status: 'pending',
      proposalNote: body.proposalNote || '',
      createdAt: new Date().toISOString(),
      requester: currentUser || users[1],
      recipient: users.find(u => u.id === body.recipientId) || users[2],
      offeredSkill: { id: body.offeredSkillId, title: 'Skill Offered' },
      wantedSkill: { id: body.wantedSkillId, title: 'Skill Wanted' }
    };
    swaps.unshift(newSwap);
    setStored('swaps', swaps);
    return { status: 201, data: newSwap };
  }

  // 10. PUT /swaps/:id/:action
  if (url.includes('/swaps/') && method === 'put') {
    const parts = url.split('/');
    const swapId = parseInt(parts[2]);
    const action = parts[3];
    const s = swaps.find(x => x.id === swapId);
    if (s) {
      if (action === 'accept') s.status = 'accepted';
      if (action === 'reject') s.status = 'rejected';
      if (action === 'complete') s.status = 'completed';
      setStored('swaps', swaps);
      return { status: 200, data: s };
    }
  }

  // 11. GET /users/:id
  if (url.startsWith('/users/') || url.includes('/users/')) {
    const id = parseInt(url.split('/').pop());
    const u = users.find(x => x.id === id) || users[1];
    return { status: 200, data: u };
  }

  // 12. GET /broadcasts/active
  if (url.includes('/broadcasts')) {
    return {
      status: 200,
      data: {
        id: 1,
        title: 'Welcome to Skill Swap',
        message: 'Explore peer skills, propose swaps, and connect with fellow creators!',
        type: 'info'
      }
    };
  }

  // 13. GET /notifications
  if (url.includes('/notifications')) {
    return { status: 200, data: [] };
  }

  // Default fallback
  return { status: 200, data: {} };
}
