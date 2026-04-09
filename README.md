<p align="center">
  <img src="public/icons/icon-512x512.png" alt="Taskiner" width="96" height="96" style="border-radius: 22px;" />
</p>

# 🧠 Taskiner™ – Smart Productivity App

**Taskiner** is a modern task management PWA built with React + Vite, designed for clarity, elegance, and real productivity. It combines glassmorphism visuals, smooth micro-animations, and smart features like the Eisenhower Matrix, streak tracking, and push notifications to create a workspace that feels premium.

> 🔗 **Live Demo:** [taskiner.vercel.app](https://taskiner.vercel.app)

---

## ⚙️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| ⚛️ Frontend | React 19 + TypeScript | Component architecture & app logic |
| 🎨 Styling | Sass (SCSS) | Glassmorphism, dark/light themes |
| 🗄️ State | Zustand | Persistent store (tasks, settings) |
| 💾 Storage | LocalStorage API | Offline-first data persistence |
| ⚡ Bundler | Vite | Lightning-fast builds & HMR |
| 🔁 PWA | Service Worker + Manifest | Offline mode, caching, auto-update |
| 🎞️ Animation | Framer Motion | Spring physics, gesture support |
| ▲ Hosting | Vercel | Continuous deployment |

---

## ✨ Features

**Task Management**
- ✅ Add, edit, and delete tasks with full detail sheet (notes, subtasks, deadline, priority, recurring)
- 📅 Deadlines with status indicators: 🟢 Upcoming · 🟠 Today · 🔴 Overdue
- 🔄 Filter by: All / Active / Completed / Category
- 🔀 Drag-to-reorder tasks, swipe to complete or delete
- 🔁 Recurring tasks (daily / weekly / monthly)

**Productivity**
- ⊞ **Eisenhower Matrix** — auto-classify tasks by urgency and importance
- 📊 **Weekly Review** — Sunday evening summary with heatmap & KPIs
- 🔥 Streak tracking with danger notification at 20:00
- ⭐ Milestones & celebration screen
- 🌅 Morning Ritual — daily focus prompt

**UX & PWA**
- 📱 Mobile-first design, fully installable PWA
- 🌗 Dark / Light theme with smooth transitions
- 📡 Offline banner + offline mode
- 🔔 Push notifications for deadlines
- 📤 Web Share API integration
- 📦 Export / Import tasks (JSON)

---

## ⚡ Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Szymon-Pochopien/taskiner.git

# 2. Navigate to the project
cd taskiner

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

Then open: **http://localhost:5173**

---

## 📲 Install as a PWA

1. Open [taskiner.vercel.app](https://taskiner.vercel.app) in Chrome, Edge, or Safari
2. Click **"Install Taskiner"** in the browser bar or app menu
3. Launch from your home screen or desktop

The app works fully offline and auto-updates on new releases.

---

## 🪄 License

Licensed under the **MIT License** — feel free to use, adapt, or extend it with proper attribution.

---

> 💡 *"Design tools that make productivity feel effortless."*
> — Szymon Pochopień, Taskiner Creator
