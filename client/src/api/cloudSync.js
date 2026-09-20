// Global Cloud Synchronization Service for Cross-Device and Cross-Account Visibility
// Connects static GitHub Pages instances across all devices to Firebase Firestore and shared cloud storage
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import app from '../config/firebase.js';

let db = null;
try {
  db = getFirestore(app);
} catch (e) {
  console.warn('Firestore initialization notice:', e);
}

let firestoreHealth = {
  active: false,
  permissionDenied: false,
  lastChecked: 0
};

let cachedCloud = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 2000; // 2 second cache to prevent redundant HTTP reads

/**
 * Remove any undefined properties recursively because Firestore rejects undefined values
 */
function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore).filter(v => v !== undefined);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

export function getFirestoreHealth() {
  return firestoreHealth;
}

/**
 * Pull latest community skills and users from Cloud Firestore
 */
export async function pullCloudStore() {
  const now = Date.now();
  if (cachedCloud && (now - lastFetchTimestamp) < CACHE_TTL_MS) {
    return cachedCloud;
  }

  // 1. Prioritize real Firebase Cloud Firestore
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'skills'));
      const firestoreSkills = [];
      snap.forEach(d => {
        firestoreSkills.push({ id: d.id, ...d.data() });
      });

      let firestoreUsers = [];
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        if (uSnap && !uSnap.empty) {
          uSnap.forEach(d => firestoreUsers.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {}

      firestoreHealth = {
        active: true,
        permissionDenied: false,
        lastChecked: now
      };

      cachedCloud = {
        skills: firestoreSkills,
        users: firestoreUsers,
        swaps: []
      };
      lastFetchTimestamp = now;
      return cachedCloud;
    } catch (fsErr) {
      if (fsErr.code === 'permission-denied') {
        firestoreHealth = {
          active: false,
          permissionDenied: true,
          lastChecked: now
        };
      }
    }
  }

  return cachedCloud || { skills: [], users: [], swaps: [] };
}

/**
 * Asynchronously save updated community skills to Firebase Cloud Firestore
 */
export async function pushCloudStore(data) {
  cachedCloud = {
    skills: Array.isArray(data.skills) ? data.skills : [],
    users: Array.isArray(data.users) ? data.users : [],
    swaps: Array.isArray(data.swaps) ? data.swaps : []
  };
  lastFetchTimestamp = Date.now();

  // 1. Sync to real Firebase Cloud Firestore
  if (db) {
    try {
      (cachedCloud.skills || []).forEach(s => {
        const docId = String(s.id || Date.now());
        const cleanSkill = sanitizeForFirestore(s);
        setDoc(doc(db, 'skills', docId), cleanSkill).catch((err) => {
          if (err?.code === 'permission-denied') {
            firestoreHealth.permissionDenied = true;
          }
        });
      });
      (cachedCloud.users || []).forEach(u => {
        const docId = String(u.id || u.email || Date.now());
        const cleanUser = sanitizeForFirestore(u);
        setDoc(doc(db, 'users', docId), cleanUser).catch(() => {});
      });
    } catch (e) {}
  }
}

/**
 * Delete a skill from Cloud Firestore
 */
export async function deleteCloudSkill(skillId) {
  if (cachedCloud && Array.isArray(cachedCloud.skills)) {
    cachedCloud.skills = cachedCloud.skills.filter(s => String(s.id) !== String(skillId));
  }
  if (db) {
    try {
      await deleteDoc(doc(db, 'skills', String(skillId)));
    } catch (e) {}
  }
}

let listenerAttached = false;

/**
 * Initialize real-time listener for Firestore skills collection
 */
export function initFirestoreSync() {
  if (!db || listenerAttached) return;
  try {
    const skillsCol = collection(db, 'skills');
    onSnapshot(skillsCol, (snap) => {
      firestoreHealth = { active: true, permissionDenied: false, lastChecked: Date.now() };
      const firestoreSkills = [];
      snap.forEach(d => {
        firestoreSkills.push({ id: d.id, ...d.data() });
      });
      if (cachedCloud) {
        cachedCloud.skills = firestoreSkills;
      } else {
        cachedCloud = { skills: firestoreSkills, users: [], swaps: [] };
      }
      lastFetchTimestamp = Date.now();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('skillswap:profile-updated'));
      }
    }, (err) => {
      if (err?.code === 'permission-denied') {
        firestoreHealth.permissionDenied = true;
      }
    });
    listenerAttached = true;
  } catch (e) {}
}

// Automatically start real-time listener on client load
if (typeof window !== 'undefined') {
  initFirestoreSync();
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
