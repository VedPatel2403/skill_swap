const { sequelize, User, Skill, Swap, Rating, Broadcast, AdminLog, Notification } = require('../models');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // 1. Create Admin (patelvedb2403@gmail.com)
    const admin = await User.create({
      name: 'Ved Patel (Administrator)',
      email: 'patelvedb2403@gmail.com',
      password: 'adminpassword123',
      role: 'admin',
      location: 'HQ / Global',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Skill Swap platform operations & moderation team.',
      availability: '24/7 Monitoring',
      isPublic: true,
      isBanned: false,
      isDemo: false
    });

    // 2. Create Users - ONLY Alex Rivera is the designated demo account
    const alex = await User.create({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: 'password123',
      role: 'user',
      location: 'San Francisco, CA',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
      bio: 'Full-stack software engineer passionate about modern web apps, TypeScript, and cloud architecture. Looking to learn Spanish and graphic design.',
      availability: 'Weekends & Weekday Evenings',
      isPublic: true,
      isBanned: false,
      isDemo: true // THE SINGLE DEMO ACCOUNT
    });

    const elena = await User.create({
      name: 'Elena Rostova',
      email: 'elena@example.com',
      password: 'password123',
      role: 'user',
      location: 'Austin, TX',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Designer & Design Systems lead. 6+ years designing user interfaces in Figma and creating brand identity systems.',
      availability: 'Weekday Evenings (6 PM - 9 PM CST)',
      isPublic: true,
      isBanned: false,
      isDemo: false
    });

    const david = await User.create({
      name: 'David Chen',
      email: 'david@example.com',
      password: 'password123',
      role: 'user',
      location: 'Seattle, WA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Data Analyst & Excel wizard. Master of advanced spreadsheets, SQL dashboards, and automated Python data pipelines.',
      availability: 'Flexible / 10 hrs per week',
      isPublic: true,
      isBanned: false,
      isDemo: false
    });

    const maria = await User.create({
      name: 'Maria Santos',
      email: 'maria@example.com',
      password: 'password123',
      role: 'user',
      location: 'Madrid / Remote',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Native Spanish instructor and acoustic guitar enthusiast. Teaching conversational fluency and fingerstyle guitar technique.',
      availability: 'Saturday Mornings & Sunday Afternoons',
      isPublic: true,
      isBanned: false,
      isDemo: false
    });

    const liam = await User.create({
      name: 'Liam Johnson',
      email: 'liam@example.com',
      password: 'password123',
      role: 'user',
      location: 'New York, NY',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Growth marketer and SEO strategist. Helped 30+ startups achieve top page ranking. Interested in Python automation.',
      availability: 'Weeknights after 7 PM EST',
      isPublic: true,
      isBanned: false,
      isDemo: false
    });

    const sophia = await User.create({
      name: 'Sophia Lee (Private Profile)',
      email: 'sophia@example.com',
      password: 'password123',
      role: 'user',
      location: 'Chicago, IL',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      bio: 'Commercial photographer and Lightroom colorist. Profile currently set to private.',
      availability: 'Sundays only',
      isPublic: false, // Testing Private Profile functionality
      isBanned: false,
      isDemo: false
    });

    const spammer = await User.create({
      name: 'Spammy Marketer (Suspended)',
      email: 'spammer@fakebot.io',
      password: 'password123',
      role: 'user',
      location: 'Unknown',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: 'Account banned for violating community guidelines and sending spam offers.',
      availability: 'None',
      isPublic: true,
      isBanned: true, // Testing Banned User state
      isDemo: false
    });

    // 3. Create Skills
    // Alex's Skills
    const alexSkillOffered1 = await Skill.create({
      userId: alex.id,
      title: 'Full-Stack React & Node.js Development',
      description: 'Hands-on mentorship in building web apps with React, Vite, Express, and modern REST APIs. Great for beginners or junior engineers looking to level up.',
      category: 'Programming',
      type: 'offered',
      proficiency: 'Expert',
      status: 'active'
    });

    const alexSkillOffered2 = await Skill.create({
      userId: alex.id,
      title: 'Python Scripting & Automation',
      description: 'Learn how to automate daily tasks, scrape web data, and write clean Python utilities.',
      category: 'Programming',
      type: 'offered',
      proficiency: 'Advanced',
      status: 'active'
    });

    const alexSkillWanted1 = await Skill.create({
      userId: alex.id,
      title: 'Figma UI/UX Design & Wireframing',
      description: 'Want to learn how to design clean modern interfaces, design tokens, and interactive component prototypes.',
      category: 'Design',
      type: 'wanted',
      proficiency: 'Beginner',
      status: 'active'
    });

    const alexSkillWanted2 = await Skill.create({
      userId: alex.id,
      title: 'Conversational Spanish Fluency',
      description: 'Looking to practice everyday spoken Spanish with a native speaker.',
      category: 'Languages',
      type: 'wanted',
      proficiency: 'Beginner',
      status: 'active'
    });

    // Elena's Skills
    const elenaSkillOffered1 = await Skill.create({
      userId: elena.id,
      title: 'Figma UI/UX & Design Systems',
      description: 'Deep dive into Figma auto-layout, components, typography hierarchy, and building scalable design libraries.',
      category: 'Design',
      type: 'offered',
      proficiency: 'Expert',
      status: 'active'
    });

    const elenaSkillOffered2 = await Skill.create({
      userId: elena.id,
      title: 'Adobe Photoshop & Photo Retouching',
      description: 'Master photo manipulation, masking, layer styles, retouching portraits, and product mockups.',
      category: 'Design',
      type: 'offered',
      proficiency: 'Advanced',
      status: 'active'
    });

    const elenaSkillWanted1 = await Skill.create({
      userId: elena.id,
      title: 'Frontend React Basics',
      description: 'Want to understand how components translate into actual code and interact with developers better.',
      category: 'Programming',
      type: 'wanted',
      proficiency: 'Beginner',
      status: 'active'
    });

    // David's Skills
    const davidSkillOffered1 = await Skill.create({
      userId: david.id,
      title: 'Advanced Microsoft Excel & Power BI',
      description: 'Learn INDEX/MATCH, XLOOKUP, pivot tables, DAX formulas, interactive KPI dashboards, and financial modeling.',
      category: 'Data & Analytics',
      type: 'offered',
      proficiency: 'Expert',
      status: 'active'
    });

    const davidSkillOffered2 = await Skill.create({
      userId: david.id,
      title: 'SQL Query Optimization & Analytics',
      description: 'Writing performant SQL queries, joins, window functions, and database schema structuring.',
      category: 'Data & Analytics',
      type: 'offered',
      proficiency: 'Advanced',
      status: 'active'
    });

    const davidSkillWanted1 = await Skill.create({
      userId: david.id,
      title: 'Search Engine Optimization (SEO)',
      description: 'Need guidance on keyword research, technical SEO, and building organic website traffic.',
      category: 'Marketing',
      type: 'wanted',
      proficiency: 'Beginner',
      status: 'active'
    });

    // Maria's Skills
    const mariaSkillOffered1 = await Skill.create({
      userId: maria.id,
      title: 'Conversational Spanish (All Levels)',
      description: 'Practice speaking with native pronunciation, essential idioms, and grammar tips tailored to your pace.',
      category: 'Languages',
      type: 'offered',
      proficiency: 'Expert',
      status: 'active'
    });

    const mariaSkillOffered2 = await Skill.create({
      userId: maria.id,
      title: 'Acoustic Guitar for Beginners',
      description: 'Learn open chords, strumming patterns, fingerpicking techniques, and play your favorite songs.',
      category: 'Music & Arts',
      type: 'offered',
      proficiency: 'Advanced',
      status: 'active'
    });

    const mariaSkillWanted1 = await Skill.create({
      userId: maria.id,
      title: 'Adobe Photoshop Graphic Creation',
      description: 'Want to learn how to create lesson thumbnails and social media banners.',
      category: 'Design',
      type: 'wanted',
      proficiency: 'Beginner',
      status: 'active'
    });

    // Liam's Skills
    const liamSkillOffered1 = await Skill.create({
      userId: liam.id,
      title: 'SEO Strategy & Organic Traffic Growth',
      description: 'On-page, off-page, and technical SEO audits, keyword research, and high-impact content architecture.',
      category: 'Marketing',
      type: 'offered',
      proficiency: 'Expert',
      status: 'active'
    });

    const liamSkillWanted1 = await Skill.create({
      userId: liam.id,
      title: 'Advanced Excel Spreadsheet Modeling',
      description: 'Want to build automated tracking sheets for multi-client marketing campaigns.',
      category: 'Data & Analytics',
      type: 'wanted',
      proficiency: 'Intermediate',
      status: 'active'
    });

    // Flagged skill to demonstrate moderation
    await Skill.create({
      userId: spammer.id,
      title: 'CRYPTO GET RICH QUICK SCHEME - 1000X GUARANTEE',
      description: 'Click this link to join a guaranteed crypto pump group! Spammy text violating platform safety rules.',
      category: 'Business',
      type: 'offered',
      proficiency: 'Expert',
      status: 'flagged',
      moderationReason: 'Suspicious crypto promotional spam'
    });

    // 4. Create Swaps in various lifecycle stages
    // A) Pending Swap: Alex -> Elena (Alex wants UI/UX, offers React)
    const pendingSwap = await Swap.create({
      requesterId: alex.id,
      recipientId: elena.id,
      offeredSkillId: alexSkillOffered1.id,
      wantedSkillId: elenaSkillOffered1.id,
      status: 'pending',
      message: "Hi Elena! I loved your portfolio. I'd love to exchange a 2-hour React session for some Figma design coaching!"
    });

    // B) Accepted Swap: Alex <-> David
    const acceptedSwap = await Swap.create({
      requesterId: david.id,
      recipientId: alex.id,
      offeredSkillId: davidSkillOffered1.id,
      wantedSkillId: alexSkillOffered2.id,
      status: 'accepted',
      message: "Hey Alex, saw you offer Python automation! Let's swap: I will teach you advanced Excel modeling for 2 Python sessions."
    });

    // C) Completed Swap: Elena <-> Maria (with Feedback & Ratings)
    const completedSwap = await Swap.create({
      requesterId: maria.id,
      recipientId: elena.id,
      offeredSkillId: mariaSkillOffered1.id,
      wantedSkillId: elenaSkillOffered2.id,
      status: 'completed',
      message: "Hola Elena, let's swap Photoshop lessons for Spanish conversational practice!",
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });

    // Ratings for Completed Swap
    await Rating.create({
      swapId: completedSwap.id,
      raterId: maria.id,
      targetUserId: elena.id,
      score: 5,
      feedback: 'Elena was an incredible instructor! She demystified Photoshop layer masks in just one hour. Very patient and articulate.'
    });

    await Rating.create({
      swapId: completedSwap.id,
      raterId: elena.id,
      targetUserId: maria.id,
      score: 5,
      feedback: 'Maria is a fantastic Spanish tutor! Her sessions were engaging and very practical. Highly recommend swapping with her!'
    });

    // Another completed swap: Alex <-> Liam
    const completedSwap2 = await Swap.create({
      requesterId: liam.id,
      recipientId: alex.id,
      offeredSkillId: liamSkillOffered1.id,
      wantedSkillId: alexSkillOffered1.id,
      status: 'completed',
      message: 'Can exchange SEO consultation for React code review.',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    await Rating.create({
      swapId: completedSwap2.id,
      raterId: liam.id,
      targetUserId: alex.id,
      score: 5,
      feedback: 'Alex helped me debug and optimize our web app performance significantly. Top-notch engineer!'
    });

    // 5. Create Platform Broadcasts
    await Broadcast.create({
      createdById: admin.id,
      title: 'Welcome to the Skill Swap Platform!',
      message: 'Explore skills offered by community members, propose swaps, and expand your abilities through peer-to-peer learning.',
      type: 'announcement',
      isActive: true
    });

    await Broadcast.create({
      createdById: admin.id,
      title: 'Scheduled Maintenance Notice',
      message: 'Platform database maintenance is scheduled for Sunday 02:00 UTC. Brief 5-minute downtime expected.',
      type: 'maintenance',
      isActive: true
    });

    // 6. Admin Logs
    await AdminLog.create({
      adminId: admin.id,
      action: 'ban_user',
      targetType: 'user',
      targetId: spammer.id,
      details: 'Suspended user for sending unsolicited crypto spam offers.'
    });

    await AdminLog.create({
      adminId: admin.id,
      action: 'create_broadcast',
      targetType: 'platform',
      targetId: null,
      details: 'Published platform launch announcement and maintenance notice.'
    });

    // 7. Seed Realistic Personalized Activity Notifications (Account-Isolated)
    await Notification.bulkCreate([
      // Alex Rivera Notifications
      {
        userId: alex.id,
        type: 'swap_request',
        title: 'New Skill Swap Proposal',
        message: 'David Chen sent you a skill swap offer for your skill "Python Scripting & Data Automation".',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        userId: alex.id,
        type: 'swap_completed',
        title: 'Swap Completed! 🌟',
        message: 'Liam Johnson marked your skill swap as completed! Please leave your rating and review.',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        userId: alex.id,
        type: 'rating_received',
        title: 'New Rating & Review Received ⭐',
        message: 'Liam Johnson gave you a 5★ rating: "Alex helped me debug and optimize our web app performance significantly. Top-notch engineer!"',
        link: `/user/${alex.id}`,
        isRead: true,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      },
      {
        userId: alex.id,
        type: 'system',
        title: 'Welcome to the Skill Swap Platform!',
        message: 'Explore skills offered by community members, propose swaps, and expand your abilities through peer-to-peer learning.',
        link: '/',
        isRead: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },

      // Elena Rostova Notifications
      {
        userId: elena.id,
        type: 'swap_accepted',
        title: 'Swap Request Accepted! 🎉',
        message: 'Maria Santos accepted your skill swap offer! You can now collaborate and schedule sessions.',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        userId: elena.id,
        type: 'rating_received',
        title: 'New Rating & Review Received ⭐',
        message: 'Maria Santos gave you a 5★ rating: "Elena was an incredible instructor! She demystified Photoshop layer masks in just one hour. Very patient and articulate."',
        link: `/user/${elena.id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
      },
      {
        userId: elena.id,
        type: 'system',
        title: 'Welcome to the Skill Swap Platform!',
        message: 'Explore skills offered by community members, propose swaps, and expand your abilities through peer-to-peer learning.',
        link: '/',
        isRead: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },

      // Maria Santos Notifications
      {
        userId: maria.id,
        type: 'swap_completed',
        title: 'Swap Completed! 🌟',
        message: 'Elena Rostova marked your Spanish & Photoshop swap as completed! Feel free to leave a rating.',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
      },
      {
        userId: maria.id,
        type: 'rating_received',
        title: 'New Rating & Review Received ⭐',
        message: 'Elena Rostova gave you a 5★ rating: "Maria is a fantastic Spanish tutor! Her sessions were engaging and very practical. Highly recommend swapping with her!"',
        link: `/user/${maria.id}`,
        isRead: true,
        createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000)
      },
      {
        userId: maria.id,
        type: 'system',
        title: 'Scheduled Maintenance Notice',
        message: 'Platform database maintenance is scheduled for Sunday 02:00 UTC. Brief 5-minute downtime expected.',
        link: '/',
        isRead: true,
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
      },

      // David Chen Notifications
      {
        userId: david.id,
        type: 'swap_request',
        title: 'Swap Offer Sent',
        message: 'Your swap proposal was delivered to Alex Rivera for Python Scripting & Data Automation.',
        link: '/swaps',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        userId: david.id,
        type: 'system',
        title: 'Welcome to the Skill Swap Platform!',
        message: 'Explore skills offered by community members, propose swaps, and expand your abilities through peer-to-peer learning.',
        link: '/',
        isRead: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },

      // Platform Administrator Notifications
      {
        userId: admin.id,
        type: 'system',
        title: 'Admin Console Initialized',
        message: 'Platform monitoring, audit logs, and user moderation controls are fully operational.',
        link: '/admin',
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ]);

    console.log('Database seeded with rich, realistic test data!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seed script finished.');
    process.exit(0);
  });
}

module.exports = seedDatabase;
