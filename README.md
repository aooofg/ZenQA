# 🧪 ZenQA | Radical Minimalism Test Management

[![Docker Image CI](https://github.com/Rostezkiy/ZenQA/actions/workflows/docker-image.yml/badge.svg)](https://github.com/Rostezkiy/ZenQA/actions/workflows/docker-image.yml)

**ZenQA** is a high-performance, radically minimalist Test Management System (TMS) engineered with an "IDE-like" philosophy. Designed for speed, it eliminates interface clutter to keep testers in the flow state, featuring a unique multi-skin architecture.

## 🚀 Core Concept

- **Radical Minimalism:** Zero-clutter UI. Every pixel serves a purpose, maximizing the workspace for actual testing.
- **Hub & Spoke Navigation:** Replaced heavy sidebars with a centralized Project Hub and context-aware top navigation.
- **Flow-State Interface:** A seamless Single Page Application (SPA) experience for managing case trees, plans, and runs without page reloads.
- **Multi-Skin Architecture:** Deep personalization through a semantic theme engine, including **Modern Clean**, **Deep Dark**, and **Win95/98 Retro** skins.

---

## 🏗 Technical Architecture

### Tech Stack
- **Backend:** [PocketBase](https://pocketbase.io/) (BaaS) — Handling Auth, Real-time DB, File Storage, and API.
- **Frontend:** [Svelte 5 (Runes)](https://svelte.dev/) — Leveraging the next-generation reactivity model for ultra-fast performance.
- **Styling:** Tailwind CSS v3 with a custom CSS Variable-based design system.
- **Icons:** Lucide-svelte.

### Engineering Principles
1. **Semantic Theming:** No hardcoded colors (e.g., `text-blue-500`). The system uses semantic tokens: `text-primary`, `bg-surface`, `border-border`, ensuring perfect rendering across all skins.
2. **Svelte 5 Logic:** Full utilization of `$state`, `$derived`, and `$effect` for robust state management.
3. **Utility-First UI:** Conflict-free class merging using a custom `cn()` utility.
4. **Data Integrity:** Version-controlled test cases with snapshotting for instant rollbacks.
5. **Hybrid Integration:** Seamless Gitea integration via REST API (PAT-based) or quick URL redirection for issue tracking.

---

## 🛠 Deployment & Quick Start

The system is fully containerized using Docker and Nginx. This ensures a consistent environment for both the frontend (Svelte 5) and the backend (PocketBase).

### 1. Prerequisites
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

### 2. Setup Environment
Clone the repository and create a `.env` file in the root directory:
```bash
git clone https://github.com/Rostezkiy/ZenQA.git
cd ZenQA
touch .env
```

Add the following variables to `.env`:
```env
# PocketBase Admin Credentials (for the first run)
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=your_secure_password
PB_ENCRYPTION_KEY=your_random_secret_key

# App Configuration
APP_ORIGIN=http://localhost:8080
```

### 3. Launch via Docker Compose
Run the following command to build and start all services (Backend, Frontend, and Nginx Proxy):
```bash
docker compose up -d
```

### 4. Initial Configuration
1.  **PocketBase Admin:** Access the database dashboard at `http://localhost:8080/_/`. Use the credentials from your `.env` file.
2.  **User Creation:** In the PocketBase Admin UI, navigate to the `users` collection and create a new record. This user will be used to log in to the ZenQA application.
3.  **Application Access:** Open `http://localhost:8080` to start using ZenQA.

---

## 🏗 System Architecture (Containers)
- **Nginx Proxy (`port 8080`):** Acts as a gateway, routing `/api/` and `/_/` to the backend and all other requests to the Svelte 5 frontend.
- **Svelte 5 Frontend:** Optimized Node.js build running on port 3000.
- **PocketBase Backend:** Go-based BaaS running on port 8090, featuring automated superuser upsert on first run and persistent data storage via Docker volumes.

---


## ✅ Current Implementation (Feature Set)

### 1. Core & Personalization
- **CSS Variable Engine:** Robust theming system managed via `app.css`.
- **Skin Switcher:** Fully functional Modern, Dark, and Pixel-perfect Windows 95 themes.
- **User Settings:** Secure storage for Gitea PAT tokens and UI preferences.
- **Security:** Auth Guards, protected routing, and secure session management.

### 2. Project Management
- **Top Navigation Bar:** Fast context switching between projects via a global dropdown.
- **Dynamic Dashboards:** Real-time statistics, Pass Rate "Health" indicators, and integration validation.
- **Project Settings:** Granular Gitea configuration (URL, Owner, Repo, Project ID) and a protected "Danger Zone."

### 3. Test Library
- **Recursive Suite Tree:** High-performance folder tree with hover-action triggers.
- **Full CRUD:** Comprehensive management of folders and test cases.
- **Smart Editor:** 
    - Automatic first-step initialization.
    - **Dirty Check:** Prevents data loss by tracking unsaved changes.
    - **Case Migration:** Move cases between suites with ease.
- **Revision History:** Automated snapshotting on save, allowing users to view and restore previous versions of test cases.

### 4. Test Planning & Execution
- **Test Plans:** Logic-based case selection and plan editing.
- **Smart Tree Selector:** Recursive checkbox logic (selecting a folder auto-includes all child cases).
- **Execution Runner:** Streamlined testing interface with Auto-advance logic (moves to the next `untested` case).
- **Evidence Collection:** Multi-file uploads, comments, and direct Gitea Issue generation during test runs.

---

## 🛠 Project Scope (Future Vision)

*Note: These features represent the architectural roadmap for the project.*

- **Bulk Actions:** Multi-selection in the suite tree for batch delete/move operations.
- **Drag-and-Drop:** Visual case reordering and suite restructuring.
- **Real-time Collaboration:** Utilizing `pb.subscribe` for live status updates when multiple testers work on the same Run.
- **Advanced Reporting:** Exporting Run results to PDF/HTML and CSV import for legacy test migration.

---

## 📂 Project Structure

- `src/lib/pb.ts` — PocketBase client initialization.
- `src/lib/treeUtils.ts` — High-performance flat-to-tree data transformation.
- `src/lib/components/ui/` — Atomic UI components (Buttons, Dialogs, Inputs).
- `src/routes/project/[id]/` — Context-aware routing for project modules.

---

**ZenQA** — Engineered for speed, built for testers. 🚀

*Developed by R057*

---