// Global Cloud Synchronization Service for Cross-Device and Cross-Account Visibility
// Connects static GitHub Pages instances across all devices to shared cloud storage

const CLOUD_ENDPOINTS = [
  'https://api.restful-api.dev/objects/ff808181a09d98f701a0bebbe4535223',
  'https://api.restful-api.dev/objects/ff808181a09d98f701a0bebc12465224'
];

let cachedCloud = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 2500; // 2.5 second cache to prevent redundant HTTP requests

// Fetch helper with timeout to ensure UI is never delayed
async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Pull latest community skills and users from the cloud
 */
export async function pullCloudStore() {
  const now = Date.now();
  if (cachedCloud && (now - lastFetchTimestamp) < CACHE_TTL_MS) {
    return cachedCloud;
  }

  for (const endpoint of CLOUD_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(endpoint, {
        headers: { 'Accept': 'application/json' }
      }, 2500);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          cachedCloud = {
            skills: Array.isArray(json.data.skills) ? json.data.skills : [],
            users: Array.isArray(json.data.users) ? json.data.users : [],
            swaps: Array.isArray(json.data.swaps) ? json.data.swaps : []
          };
          lastFetchTimestamp = now;
          return cachedCloud;
        }
      }
    } catch (e) {
      // Try next endpoint on error/timeout
    }
  }

  return cachedCloud || { skills: [], users: [], swaps: [] };
}

/**
 * Asynchronously save updated community skills to the cloud store
 */
export async function pushCloudStore(data) {
  cachedCloud = {
    skills: Array.isArray(data.skills) ? data.skills : [],
    users: Array.isArray(data.users) ? data.users : [],
    swaps: Array.isArray(data.swaps) ? data.swaps : []
  };
  lastFetchTimestamp = Date.now();

  const payload = {
    name: 'SkillSwap Production Cloud Sync Store',
    data: {
      version: 1,
      updatedAt: Date.now(),
      skills: cachedCloud.skills,
      users: cachedCloud.users,
      swaps: cachedCloud.swaps
    }
  };

  // Push to endpoints in the background without blocking execution
  Promise.allSettled(
    CLOUD_ENDPOINTS.map(endpoint =>
      fetchWithTimeout(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 4000)
    )
  ).catch(() => {});
}

/**
 * Merge cloud skills and users into local mock storage
 */
export function mergeCloudIntoLocal(localUsers, cloudData) {
  if (!cloudData || !Array.isArray(cloudData.skills)) return localUsers;

  const usersMap = new Map();
  // Index existing local users
  localUsers.forEach(u => {
    const key = u.email ? u.email.toLowerCase() : String(u.id);
    usersMap.set(key, { ...u, skillsOffered: [...(u.skillsOffered || [])], skillsWanted: [...(u.skillsWanted || [])] });
  });

  // Merge cloud users
  (cloudData.users || []).forEach(cu => {
    if (!cu) return;
    const key = cu.email ? cu.email.toLowerCase() : String(cu.id);
    if (!usersMap.has(key)) {
      usersMap.set(key, {
        ...cu,
        skillsOffered: [...(cu.skillsOffered || [])],
        skillsWanted: [...(cu.skillsWanted || [])]
      });
    }
  });

  // Attach cloud skills to user accounts
  (cloudData.skills || []).forEach(cs => {
    if (!cs || !cs.title) return;
    const ownerId = cs.userId || cs.user?.id;
    const ownerEmail = cs.user?.email;
    const key = ownerEmail ? ownerEmail.toLowerCase() : String(ownerId);

    let targetUser = usersMap.get(key);
    if (!targetUser) {
      targetUser = {
        id: ownerId || Date.now(),
        name: cs.user?.name || 'Community Member',
        email: ownerEmail || `user_${ownerId || Date.now()}@skillswap.app`,
        avatar: cs.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cs.title)}`,
        location: cs.user?.location || 'Remote',
        role: 'user',
        isPublic: true,
        isBanned: false,
        skillsOffered: [],
        skillsWanted: []
      };
      usersMap.set(key, targetUser);
    }

    const listKey = cs.type === 'wanted' ? 'skillsWanted' : 'skillsOffered';
    const exists = targetUser[listKey].some(s =>
      s.id === cs.id || (s.title && cs.title && s.title.toLowerCase() === cs.title.toLowerCase())
    );

    if (!exists) {
      targetUser[listKey].unshift({
        id: cs.id,
        userId: targetUser.id,
        title: cs.title,
        category: cs.category || 'Technology',
        type: cs.type || 'offered',
        proficiency: cs.proficiency || 'Intermediate',
        description: cs.description || '',
        status: cs.status || 'active',
        createdAt: cs.createdAt || new Date().toISOString()
      });
    }
  });

  return Array.from(usersMap.values());
}
