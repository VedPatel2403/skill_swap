# 🔄 Skill Swap Platform

A production-ready, full-stack peer-to-peer knowledge and skill exchange web application built to fulfill all requirements and architectural constraints specified in the Skill Swap Platform challenge.

---

## 🚀 Live Evaluation & Access

The application runs as a unified full-stack system:
* **Application URL:** [http://localhost:5000](http://localhost:5000)
* **REST API URL:** [http://localhost:5000/api](http://localhost:5000/api)

### ⚡ Quick Demo Accounts (1-Click Login available in the UI Navbar & Login page)

| Role | Account Name | Email | Password | Primary Skills |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Platform Administrator | `admin@skillswap.com` | `adminpassword123` | Governance, Content Moderation, Reporting |
| **User** | Alex Rivera | `alex@example.com` | `password123` | React, Node.js, Python Automation |
| **User** | Elena Rostova | `elena@example.com` | `password123` | Figma UI/UX, Adobe Photoshop, Retouching |
| **User** | David Chen | `david@example.com` | `password123` | Advanced Excel, Power BI, SQL Dashboards |
| **User** | Maria Santos | `maria@example.com` | `password123` | Conversational Spanish, Acoustic Guitar |
| **User** | Liam Johnson | `liam@example.com` | `password123` | SEO Strategy, Organic Growth Marketing |
| **User** | Sophia Lee *(Private)* | `sophia@example.com` | `password123` | Photography, Color Grading *(Private Profile)* |
| **User** | Spammer *(Banned)* | `spammer@fakebot.io` | `password123` | *(Suspended account demonstrating ban moderation)* |

---

## 🌟 Key Features & Constraint Checklist

### 1. User Features
- [x] **User Basic Info Editable:** Profile name, optional location, avatar URL/preset, and personal bio.
- [x] **Separate Lists for Skills:** Dedicated management for **"Skills Offered"** (to teach) and **"Skills Wanted"** (to learn), categorized with proficiency levels (*Beginner*, *Intermediate*, *Advanced*, *Expert*).
- [x] **General Availability Field:** Configurable schedule badge (e.g. *"Weekends & Weekday Evenings"* or *"10 hrs/week"*).
- [x] **Privacy Control Toggle:** 1-click toggle between **Public** and **Private** modes. Private profiles and their skills are automatically excluded from the public directory and search results.
- [x] **Browse & Global Search:** Search across all community skills by keywords (e.g., `"Photoshop"`, `"Excel"`, `"React"`), filter by Category, Proficiency, and Type.
- [x] **Swap Management Lifecycle:**
  - **Request a Swap:** Propose an exchange by pairing one of your offered skills with one of the partner's skills, plus a proposal note.
  - **Current & Pending Swaps Dashboard:** Organized tabs for *Inbound Offers*, *Outbound Pending*, *Active Swaps*, *Completed Swaps*, and *Past/Declined*.
  - **Accept or Reject:** Inbound offers can be accepted or declined with an optional reason.
  - **Delete Pending Swap:** Users can safely delete/cancel their own swap request **if it has not yet been accepted**.
  - **Mark Completed:** In-progress swaps can be completed by either partner once sessions take place.
- [x] **Post-Swap Ratings & Feedback:**
  - Rating (1 to 5 stars) and detailed testimonial reviews become active **only AFTER a swap is marked as completed**.
  - Dynamic calculation and display of average ratings, review counts, and testimonials on public profiles.

### 2. Admin Role Features (Dedicated Command Console)
- [x] **Platform Monitoring:** KPI dashboard displaying total users, active skills, pending swaps, active swaps, completed exchanges, and reviews with real-time audit logs.
- [x] **User Moderation:** Full user registry table with 1-click **Ban / Suspend** and **Unban / Reinstate** capabilities. Suspended users are immediately blocked from logging in or swapping.
- [x] **Content Moderation:** Inspection queue of all skills platform-wide. Reject or delete spammy/inappropriate skill descriptions with audit reason tracking.
- [x] **Swap Oversight:** Platform-wide monitoring table showing all swap agreements across pending, accepted, completed, and rejected states.
- [x] **Platform-Wide Messaging:** Administrator tool to draft and publish system announcements (feature updates, maintenance alerts) displayed in a dismissible banner across the application for all users.
- [x] **Downloadable Reports (CSV):**
  - `user_activity_report.csv`: Complete user registry, roles, activity counts, timestamps.
  - `swap_statistics_report.csv`: Complete archive of all swaps, participants, offered/wanted skills, completion statuses.
  - `feedback_ratings_report.csv`: All reviews, 1-5 star ratings, and rater/recipient pairings.

---

## 🛠️ Architecture & Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6.
* **Backend:** Node.js, Express.js RESTful API, JSON Web Tokens (JWT), Bcrypt password hashing.
* **Database & ORM:** Sequelize ORM with SQLite (zero-dependency, instant execution, auto-seeded). Dual-mode architecture enables switching to PostgreSQL with a single `DATABASE_URL` or `DB_DIALECT=postgres` variable.
* **Design System:** "Classic & Clean" aesthetic adhering strictly to the visual reference with high negative space, subtle borders, slate/neutral monochrome palette, and clear visual hierarchy for primary actions.

---

## 🏃 Running the Application Locally

### Prerequisites
* Node.js v18+ and npm installed.

### Installation & Launch
From the root directory:

```bash
# 1. Install dependencies
npm --prefix server install
npm --prefix client install

# 2. Build the client
npm --prefix client run build

# 3. Start the server (serves both REST API and React frontend)
npm start
```

### Running E2E Test Suite
To run the automated validation test suite that verifies all 29 requirements:

```bash
cd server
node test-e2e.js
```
