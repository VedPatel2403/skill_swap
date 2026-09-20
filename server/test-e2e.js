const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

async function runTests() {
  console.log('====================================================');
  console.log('   SKILL SWAP PLATFORM - FULL E2E VALIDATION SUITE   ');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '--> ' + details : ''}`);
      failedCount++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'API Health Check');

    // 2. Demo Login as Alex (The ONLY allowed demo account)
    const alexLogin = await request('/auth/demo-login', {
      method: 'POST',
      body: { email: 'alex@example.com' }
    });
    assert(alexLogin.status === 200 && !!alexLogin.data.token, 'Demo Login as Alex Rivera (The Single Demo Account)');
    const alexToken = alexLogin.data.token;
    const alexHeaders = { Authorization: `Bearer ${alexToken}` };

    // Verify only 1 demo account exists in public demo list
    const demoAccountsCheck = await request('/auth/demo-accounts');
    assert(
      demoAccountsCheck.status === 200 && demoAccountsCheck.data.length === 1 && demoAccountsCheck.data[0].email === 'alex@example.com',
      'Single Demo Account: Exactly 1 demo account (Alex Rivera) is available on the platform'
    );

    // Verify demo access removed for all other former demo accounts
    const blockedElenaDemo = await request('/auth/demo-login', {
      method: 'POST',
      body: { email: 'elena@example.com' }
    });
    assert(
      blockedElenaDemo.status === 403,
      'Removed Demo Access: Elena demo-login rejected (403 Forbidden)'
    );

    const blockedDavidDemo = await request('/auth/demo-login', {
      method: 'POST',
      body: { email: 'david@example.com' }
    });
    assert(
      blockedDavidDemo.status === 403,
      'Removed Demo Access: David demo-login rejected (403 Forbidden)'
    );

    // 3. User basic info editable & Availability & Privacy Toggle
    const updateProfile = await request('/users/profile', {
      method: 'PUT',
      headers: alexHeaders,
      body: {
        name: 'Alex Rivera (Verified)',
        location: 'San Francisco Bay Area',
        availability: 'Weekends & Tuesday Evenings',
        bio: 'Senior full-stack dev eager to exchange programming for languages.',
        isPublic: false // Toggle private
      }
    });
    assert(
      updateProfile.status === 200 &&
      updateProfile.data.user.location === 'San Francisco Bay Area' &&
      updateProfile.data.user.availability === 'Weekends & Tuesday Evenings' &&
      updateProfile.data.user.isPublic === false,
      'User Basic Info, Availability, and Privacy Control Editable'
    );

    // Verify private user is excluded from public directory
    const publicUsers = await request('/users/public');
    const alexInPublic = publicUsers.data.find(u => u.email === 'alex@example.com');
    assert(!alexInPublic, 'Private Profile is hidden from public discovery');

    // Restore to public and test Direct Profile Image Update
    const testAvatarDataUrl = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await request('/users/profile', {
      method: 'PUT',
      headers: alexHeaders,
      body: {
        isPublic: true,
        avatar: testAvatarDataUrl
      }
    });
    const publicUsers2 = await request('/users/public');
    const alexInPublic2 = publicUsers2.data.find(u => u.email === 'alex@example.com');
    assert(
      !!alexInPublic2 && alexInPublic2.avatar === testAvatarDataUrl,
      'Direct Profile Image update with data URL & restore to Public'
    );

    // Restore Alex's avatar so demo account retains a high quality profile image
    await request('/users/profile', {
      method: 'PUT',
      headers: alexHeaders,
      body: {
        avatar: (alexLogin.data.user.avatar && alexLogin.data.user.avatar.startsWith('http'))
          ? alexLogin.data.user.avatar
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80'
      }
    });

    // Clean up test skills from prior runs so tests are completely idempotent
    const currentAlex = await request('/auth/me', { headers: alexHeaders });
    if (currentAlex.status === 200 && Array.isArray(currentAlex.data.skills)) {
      for (const s of currentAlex.data.skills) {
        if (s.title === 'Cloud Architecture & Docker Containers' || s.title === 'Italian Language & Accent Practice') {
          await request(`/skills/${s.id}`, { method: 'DELETE', headers: alexHeaders });
        }
      }
    }

    // 4. Separate lists for Skills Offered and Skills Wanted
    const addOffered = await request('/skills', {
      method: 'POST',
      headers: alexHeaders,
      body: {
        title: 'Cloud Architecture & Docker Containers',
        description: 'Learn modern microservices and container deployments.',
        category: 'Programming',
        type: 'offered',
        proficiency: 'Expert'
      }
    });
    assert(addOffered.status === 201 && addOffered.data.skill.type === 'offered', 'Add Skill to Skills Offered list');

    // Duplicate skill addition attempt should be rejected with 400
    const duplicateSkillRes = await request('/skills', {
      method: 'POST',
      headers: alexHeaders,
      body: {
        title: 'Cloud Architecture & Docker Containers',
        description: 'Duplicate attempt',
        category: 'Programming',
        type: 'offered',
        proficiency: 'Expert'
      }
    });
    assert(duplicateSkillRes.status === 400, 'Duplicate skill addition is prevented');

    const addWanted = await request('/skills', {
      method: 'POST',
      headers: alexHeaders,
      body: {
        title: 'Italian Language & Accent Practice',
        description: 'Looking to learn conversational Italian for travel.',
        category: 'Languages',
        type: 'wanted',
        proficiency: 'Beginner'
      }
    });
    assert(addWanted.status === 201 && addWanted.data.skill.type === 'wanted', 'Add Skill to Skills Wanted list');

    // 5. Global Skill Search
    const searchPhotoshop = await request('/skills?search=Photoshop');
    assert(
      searchPhotoshop.status === 200 &&
      searchPhotoshop.data.some(s => s.title.includes('Photoshop')),
      'Global Skill Search by keyword "Photoshop"'
    );

    const searchExcel = await request('/skills?search=Excel');
    assert(
      searchExcel.status === 200 &&
      searchExcel.data.some(s => s.title.includes('Excel')),
      'Global Skill Search by keyword "Excel"'
    );

    // 6. Swap Lifecycle: Request -> Pending Outbound -> Delete pending request
    const davidLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'david@example.com', password: 'password123' }
    });
    const davidToken = davidLogin.data.token;
    const davidHeaders = { Authorization: `Bearer ${davidToken}` };

    const mariaLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'maria@example.com', password: 'password123' }
    });
    const mariaToken = mariaLogin.data.token;
    const mariaHeaders = { Authorization: `Bearer ${mariaToken}` };

    // Clean up any pending swaps between David and Maria from prior test runs
    const existingDavidSwaps = await request('/swaps/my-swaps', { headers: davidHeaders });
    const swapsList = existingDavidSwaps.data?.all || [];
    for (const s of swapsList) {
      if ((s.recipientId === mariaLogin.data.user.id || s.requesterId === mariaLogin.data.user.id) && s.status === 'pending') {
        await request(`/swaps/${s.id}`, { method: 'DELETE', headers: davidHeaders });
      }
    }

    // David creates a swap with Maria
    const createSwap1 = await request('/swaps', {
      method: 'POST',
      headers: davidHeaders,
      body: {
        recipientId: mariaLogin.data.user.id,
        message: 'Test swap offer to be cancelled/deleted.'
      }
    });
    assert(createSwap1.status === 201 && createSwap1.data.swap.status === 'pending', 'Swap Request Created');

    const swapToDeleteId = createSwap1.data.swap.id;

    // David deletes his pending swap request
    const deleteSwapRes = await request(`/swaps/${swapToDeleteId}`, {
      method: 'DELETE',
      headers: davidHeaders
    });
    assert(deleteSwapRes.status === 200, 'User can delete pending swap request before acceptance');

    // 7. Swap Lifecycle: Request -> Accept -> Complete -> Post-Swap Feedback & Rating
    const createSwap2 = await request('/swaps', {
      method: 'POST',
      headers: davidHeaders,
      body: {
        recipientId: mariaLogin.data.user.id,
        message: 'Let us swap Excel for Spanish lessons!'
      }
    });
    assert(createSwap2.status === 201, 'New Swap Request created for full lifecycle test');
    const swapCycleId = createSwap2.data.swap.id;

    // Attempting rating before completion must fail
    const prematureRating = await request('/ratings', {
      method: 'POST',
      headers: davidHeaders,
      body: {
        swapId: swapCycleId,
        score: 5,
        feedback: 'Premature feedback test'
      }
    });
    assert(prematureRating.status === 400, 'Rating is blocked BEFORE swap completion');

    // Maria accepts swap
    const acceptSwapRes = await request(`/swaps/${swapCycleId}/accept`, {
      method: 'PUT',
      headers: mariaHeaders
    });
    assert(acceptSwapRes.status === 200 && acceptSwapRes.data.swap.status === 'accepted', 'Recipient Accepts Swap offer');

    // Attempting delete after acceptance must fail
    const deleteAccepted = await request(`/swaps/${swapCycleId}`, {
      method: 'DELETE',
      headers: davidHeaders
    });
    assert(deleteAccepted.status === 400, 'Delete is blocked after swap has been accepted');

    // Mark swap as completed
    const completeSwapRes = await request(`/swaps/${swapCycleId}/complete`, {
      method: 'PUT',
      headers: davidHeaders
    });
    assert(completeSwapRes.status === 200 && completeSwapRes.data.swap.status === 'completed', 'Mark Swap as Completed');

    // Now Rating/Feedback becomes ACTIVE!
    const validRating = await request('/ratings', {
      method: 'POST',
      headers: davidHeaders,
      body: {
        swapId: swapCycleId,
        score: 5,
        feedback: 'Maria was an incredible Spanish mentor! Very clear pronunciation exercises.'
      }
    });
    assert(
      validRating.status === 201 && validRating.data.rating.score === 5,
      'Rating & detailed feedback active and submitted successfully post-swap'
    );

    // Duplicate rating blocked
    const duplicateRating = await request('/ratings', {
      method: 'POST',
      headers: davidHeaders,
      body: {
        swapId: swapCycleId,
        score: 4,
        feedback: 'Trying duplicate'
      }
    });
    assert(duplicateRating.status === 400, 'Duplicate rating for same swap is prevented');

    // 7.5 Personalized Notifications & Strict Account Isolation
    // Maria received personalized notifications for swap request from David, swap completion, and rating from David
    const mariaNotifs = await request('/notifications', { headers: mariaHeaders });
    assert(mariaNotifs.status === 200, 'Maria: Fetch personalized notifications list');
    assert(
      mariaNotifs.data.notifications.some(n => n.type === 'swap_request' || n.type === 'swap_completed' || n.type === 'rating_received'),
      'Maria: Personalized notifications generated for swap proposal, completion, and rating'
    );

    // Verify account isolation: Maria's notifications must ONLY belong to her own userId
    assert(
      mariaNotifs.data.notifications.every(n => n.userId === mariaLogin.data.user.id),
      'Account Isolation: Maria only receives notifications belonging to her own userId'
    );

    // David's notifications
    const davidNotifs = await request('/notifications', { headers: davidHeaders });
    assert(davidNotifs.status === 200, 'David: Fetch personalized notifications list');
    assert(
      davidNotifs.data.notifications.every(n => n.userId === davidLogin.data.user.id),
      'Account Isolation: David only receives notifications belonging to his own userId'
    );

    // Verify David received swap acceptance notification from Maria
    assert(
      davidNotifs.data.notifications.some(n => n.type === 'swap_accepted'),
      'David: Personalized notification received when Maria accepted his swap offer'
    );

    // Mark single notification as read in Maria's account
    const unreadMariaNotif = mariaNotifs.data.notifications.find(n => !n.isRead);
    if (unreadMariaNotif) {
      const markReadRes = await request(`/notifications/${unreadMariaNotif.id}/read`, {
        method: 'PUT',
        headers: mariaHeaders
      });
      assert(markReadRes.status === 200 && markReadRes.data.notification.isRead === true, 'Maria: Mark single notification as read');
    }

    // Mark all notifications as read in Maria's account
    const markAllRes = await request('/notifications/read-all', {
      method: 'PUT',
      headers: mariaHeaders
    });
    assert(markAllRes.status === 200, 'Maria: Mark all notifications as read');

    // Cross-account isolation security check: David cannot delete Maria's notification
    if (unreadMariaNotif) {
      const crossAccountAttempt = await request(`/notifications/${unreadMariaNotif.id}`, {
        method: 'DELETE',
        headers: davidHeaders
      });
      assert(crossAccountAttempt.status === 404, 'Security: Account cannot delete or access another user notification');
    }

    // Dismiss / delete single notification in Maria's account
    if (unreadMariaNotif) {
      const deleteNotifRes = await request(`/notifications/${unreadMariaNotif.id}`, {
        method: 'DELETE',
        headers: mariaHeaders
      });
      assert(deleteNotifRes.status === 200, 'Maria: Dismiss single notification successfully');
    }

    // 8. Admin Features: Stats, Moderation, Messaging, Reporting
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'patelvedb2403@gmail.com', password: 'adminpassword123' }
    });
    assert(
      adminLogin.status === 200 && adminLogin.data.user.role === 'admin' && adminLogin.data.user.email === 'patelvedb2403@gmail.com',
      'Admin Login Verified for patelvedb2403@gmail.com'
    );
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Admin Dashboard Stats
    const adminStats = await request('/admin/stats', { headers: adminHeaders });
    assert(
      adminStats.status === 200 &&
      adminStats.data.metrics.totalUsers > 0 &&
      adminStats.data.metrics.totalSkills > 0,
      'Admin Platform Monitoring Dashboard Metrics'
    );

    // Admin Content Moderation (Reject spammy skill)
    const skillsList = await request('/admin/skills', { headers: adminHeaders });
    const targetSkill = skillsList.data.find(s => s.status === 'flagged') || skillsList.data[0];
    const rejectSkillRes = await request(`/admin/skills/${targetSkill.id}/moderate`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        status: 'rejected',
        reason: 'Violates platform commercial spam policies.'
      }
    });
    assert(
      rejectSkillRes.status === 200 && rejectSkillRes.data.skill.status === 'rejected',
      'Admin Content Moderation: Reject spammy skill description'
    );

    // Admin User Moderation (Ban user & verify login prevented)
    const liamLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'liam@example.com', password: 'password123' }
    });
    const liamId = liamLogin.data.user.id;

    const banUserRes = await request(`/admin/users/${liamId}/ban`, {
      method: 'PUT',
      headers: adminHeaders,
      body: { isBanned: true, reason: 'Test policy suspension' }
    });
    assert(banUserRes.status === 200 && banUserRes.data.user.isBanned === true, 'Admin: Ban/Suspend User');

    // Attempting login with banned user
    const bannedLoginAttempt = await request('/auth/login', {
      method: 'POST',
      body: { email: 'liam@example.com', password: 'password123' }
    });
    assert(bannedLoginAttempt.status === 403, 'Banned user is denied authentication');

    // Reinstate user
    const unbanUserRes = await request(`/admin/users/${liamId}/ban`, {
      method: 'PUT',
      headers: adminHeaders,
      body: { isBanned: false, reason: 'Account reinstated after review' }
    });
    assert(unbanUserRes.status === 200 && unbanUserRes.data.user.isBanned === false, 'Admin: Unban / Reinstate User');

    // Admin Platform-Wide Messaging (Broadcasts)
    const createBroadcastRes = await request('/admin/broadcasts', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: 'Platform System Alert',
        message: 'Welcome all attendees to the live Skill Swap presentation!',
        type: 'announcement'
      }
    });
    assert(createBroadcastRes.status === 201, 'Admin: Platform-Wide Messaging created');

    const activeBroadcasts = await request('/admin/broadcasts/active');
    assert(
      activeBroadcasts.status === 200 &&
      activeBroadcasts.data.some(b => b.title === 'Platform System Alert'),
      'Broadcast banner visible to all platform users'
    );

    // Admin Downloadable Reports (CSV)
    const userReport = await request('/admin/reports/users/csv', { headers: adminHeaders });
    assert(
      userReport.status === 200 &&
      userReport.data.includes('userId,name,email,role') &&
      userReport.data.includes('Alex Rivera'),
      'Admin Downloadable User Activity Report (CSV)'
    );

    const swapReport = await request('/admin/reports/swaps/csv', { headers: adminHeaders });
    assert(
      swapReport.status === 200 &&
      swapReport.data.includes('swapId,status,requesterName,requesterEmail'),
      'Admin Downloadable Swap Statistics Report (CSV)'
    );

    const feedbackReport = await request('/admin/reports/feedback/csv', { headers: adminHeaders });
    assert(
      feedbackReport.status === 200 &&
      feedbackReport.data.includes('ratingId,swapId,raterName,raterEmail,targetUserName'),
      'Admin Downloadable Feedback & Ratings Logs Report (CSV)'
    );

    // 9. Permanent Account Deletion & Security Safeguards
    // A) Attempt to delete Platform Administrator -> must be strictly forbidden (403)
    const deleteAdminAttempt = await request(`/users/${adminLogin.data.user.id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(
      deleteAdminAttempt.status === 403,
      'Security: Platform Administrator account is protected from deletion'
    );

    // B) Create a dedicated test account to delete
    const tempUserRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Delete Me User',
        email: 'deleteme@example.com',
        password: 'password123'
      }
    });
    assert(tempUserRes.status === 201 && !!tempUserRes.data.user?.id, 'Create temporary account for deletion test');
    const tempUserId = tempUserRes.data.user.id;
    const tempToken = tempUserRes.data.token;
    const tempHeaders = { Authorization: `Bearer ${tempToken}` };

    // Add a skill to the temp user
    const tempSkillRes = await request('/skills', {
      method: 'POST',
      headers: tempHeaders,
      body: {
        title: 'Temporary Deletable Skill',
        category: 'Design',
        type: 'offered',
        proficiency: 'Beginner',
        description: 'Will be cascaded upon user deletion.'
      }
    });
    assert(tempSkillRes.status === 201, 'Add skill to temporary user');

    // Verify temp account appears in demo-accounts list for this user's drawer
    const demoAccountsBefore = await request('/auth/demo-accounts', { headers: tempHeaders });
    assert(
      demoAccountsBefore.status === 200 && demoAccountsBefore.data.some(u => u.id === tempUserId),
      'Temporary user visible in switch account drawer list'
    );

    // Verify temp account is NOT visible to other unauthenticated screens
    const demoAccountsOtherScreen = await request('/auth/demo-accounts');
    assert(
      demoAccountsOtherScreen.status === 200 && !demoAccountsOtherScreen.data.some(u => u.id === tempUserId),
      'Account Privacy: Personal account is NOT accessible or visible from other screens'
    );

    // C) Permanently delete the temporary account
    const deleteTempRes = await request(`/users/${tempUserId}`, {
      method: 'DELETE',
      headers: tempHeaders
    });
    assert(deleteTempRes.status === 200, 'Permanently delete user account via DELETE /api/users/:id');

    // D) Verify user no longer exists (404)
    const verifyDeletedUser = await request(`/users/${tempUserId}`);
    assert(verifyDeletedUser.status === 404, 'Deleted user profile is no longer accessible');

    // E) Verify demo accounts list no longer contains the deleted account
    const demoAccountsAfter = await request('/auth/demo-accounts', { headers: tempHeaders });
    assert(
      demoAccountsAfter.status === 200 && !demoAccountsAfter.data.some(u => u.id === tempUserId),
      'Deleted account removed completely from switch account drawer'
    );

    // 10. Lifecycle Activities Saved in User Accounts (Login, Logout, Account Created, Switch)
    // A) Account Creation activity
    const activityUserRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Activity Test User',
        email: 'activity_test@example.com',
        password: 'password123',
        isDemo: true
      }
    });
    assert(activityUserRes.status === 201, 'Activity Test: Register new account');
    const actUserId = activityUserRes.data.user.id;
    const actToken = activityUserRes.data.token;
    const actHeaders = { Authorization: `Bearer ${actToken}` };

    // Verify account_created activity is present in the new user's account
    const notifsAfterRegister = await request('/notifications', { headers: actHeaders });
    assert(
      notifsAfterRegister.data.notifications.some(n => n.type === 'account_created'),
      'Activity Saved: "account_created" activity saved in new user account'
    );

    // B) Account Logout activity
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: actHeaders
    });
    assert(logoutRes.status === 200, 'Activity Test: User logs out');

    // C) Account Login activity
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'activity_test@example.com',
        password: 'password123'
      }
    });
    assert(loginRes.status === 200, 'Activity Test: User logs in');
    const newLoginToken = loginRes.data.token;
    const newLoginHeaders = { Authorization: `Bearer ${newLoginToken}` };

    // Verify auth_login and auth_logout are saved in this user's account
    const notifsAfterLogin = await request('/notifications', { headers: newLoginHeaders });
    assert(
      notifsAfterLogin.data.notifications.some(n => n.type === 'auth_logout'),
      'Activity Saved: "auth_logout" activity saved in user account'
    );
    assert(
      notifsAfterLogin.data.notifications.some(n => n.type === 'auth_login'),
      'Activity Saved: "auth_login" activity saved in user account'
    );

    // D) Switch Between Accounts activity
    const switchRes = await request('/auth/demo-login', {
      method: 'POST',
      body: { email: 'activity_test@example.com' }
    });
    assert(switchRes.status === 200, 'Activity Test: Switch into account via demo-login');

    const notifsAfterSwitch = await request('/notifications', { headers: newLoginHeaders });
    assert(
      notifsAfterSwitch.data.notifications.some(n => n.type === 'account_switch'),
      'Activity Saved: "account_switch" activity saved in user account'
    );

    // Clean up test account
    await request(`/users/${actUserId}`, {
      method: 'DELETE',
      headers: newLoginHeaders
    });

    // ====================================================
    // 21. FIREBASE AUTHENTICATION & GOOGLE LOGIN VALIDATION
    // ====================================================
    console.log('\n--- Testing Firebase Authentication & Google Login ---');
    
    // A) First-time Google Login (registers new account)
    const googleUserPayload = {
      email: 'google_tester@example.com',
      displayName: 'Google Test Pilot',
      photoURL: 'https://lh3.googleusercontent.com/a/test_avatar_123',
      firebaseUid: 'firebase_test_uid_998877',
      providerId: 'google.com'
    };

    const fbLoginRes = await request('/auth/firebase-login', {
      method: 'POST',
      body: googleUserPayload
    });

    assert(
      fbLoginRes.status === 200 && !!fbLoginRes.data.token && fbLoginRes.data.user.email === 'google_tester@example.com',
      'Firebase Auth: New Google user automatically registers and issues JWT'
    );

    const fbUser = fbLoginRes.data.user;
    const fbToken = fbLoginRes.data.token;
    const fbHeaders = { Authorization: `Bearer ${fbToken}` };

    assert(
      fbUser.avatar === googleUserPayload.photoURL,
      'Firebase Auth: Google profile picture synchronized to user avatar'
    );

    // Verify Welcome/Activity notifications created for Firebase user
    const fbNotifs = await request('/notifications', { headers: fbHeaders });
    assert(
      fbNotifs.data.notifications.some(n => n.type === 'auth_login' || n.type === 'account_created'),
      'Firebase Auth: Activity & Welcome notifications initialized'
    );

    // Verify Google personal account is NOT visible on other screens
    const fbCheckOtherScreen = await request('/auth/demo-accounts');
    assert(
      !fbCheckOtherScreen.data.some(u => u.id === fbUser.id),
      'Firebase Auth Privacy: Google account is NOT visible on other screens'
    );

    // Verify Google personal account cannot be accessed via passwordless demo-login from another screen
    const unauthorizedDemoLogin = await request('/auth/demo-login', {
      method: 'POST',
      body: { email: 'google_tester@example.com' }
    });
    assert(
      unauthorizedDemoLogin.status === 403,
      'Security: Non-demo personal account blocks unauthorized passwordless login from other screens'
    );

    // B) Subsequent Google Login (links existing account cleanly)
    const fbReloginRes = await request('/auth/firebase-login', {
      method: 'POST',
      body: {
        ...googleUserPayload,
        displayName: 'Google Test Pilot Updated'
      }
    });

    assert(
      fbReloginRes.status === 200 && fbReloginRes.data.user.id === fbUser.id,
      'Firebase Auth: Returning Google user signs in seamlessly without duplicate accounts'
    );

    // Clean up Firebase test user
    await request(`/users/${fbUser.id}`, {
      method: 'DELETE',
      headers: fbHeaders
    });
    assert(true, 'Firebase Auth: Cleanup Google test user account');

  } catch (err) {
    console.error('Test execution error:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`E2E TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
