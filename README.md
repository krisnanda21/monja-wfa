# Task Manager Application

A modern, hierarchical task management and workflow approval system built for multi-tiered organizational structures.

## 🚀 Technology Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React framework utilizing the **App Router** (`app/` directory) for layouts, routing, and Server API endpoints.
- **[React](https://react.dev/)** - Core library for building interactive user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)** - Strongly typed programming language building on JavaScript.

### Database & ORM
- **[Prisma ORM](https://www.prisma.io/)** - Next-generation Node.js and TypeScript ORM for database modeling, migrations, and type-safe data access.
- **[SQLite](https://www.sqlite.org/)** - Lightweight, file-based relational database management system (easily swappable to PostgreSQL or MySQL for production).

### Styling
- **CSS Modules** (`*.module.css`) - Component-level local CSS to prevent style clashes and ensure modularity.
- **Global CSS** (`globals.css`) - For application-wide design tokens, resets, and typography variables.
- **[Geist Font](https://vercel.com/font)** - Vercel's optimized font families (`Geist` Sans and `Geist Mono`).

## 🏗️ Architecture & Features

### 1. Hierarchical User Roles
The application strictly enforces a hierarchical flow composed of 6 distinct roles:
1. **Admin**: Platform management, user CRUD operations, bulk import via CSV.
2. **Anggota Tim**: Task implementers. Uploads work files (`.pdf`) or URLs.
3. **Ketua Tim**: Task creators. Oversees Anggota Tim, reviews work, uploads supplemental files, and forwards task to Dalnis.
4. **Dalnis**: Medium-level reviewer (Approve/Reject).
5. **Subkoordinator**: High-level reviewer (Approve/Reject).
6. **Koordinator**: Final executor. Approving a task here marks it as `Completed`.

Subbagian classifications slice the workforce into distinct departments: *Penkom*, *Bangkom*, *Pembinaan*, and *Khusus*.

### 2. Workflow & State Machine
Approvals operate at the **Task Level**. State transitions cascade hierarchically. 
- *Forward Flow*: `SedangDikerjakan` -> `ApprovalKetuaTim` -> `ApprovalDalnis` -> `ApprovalSubkoor` -> `ApprovalKoordinator` -> `Completed`.
- *Rejection Flow*: Any rejection sends the task back down to the previous responsible tier (e.g., `RejectDalnis` drops the task back to `Ketua Tim` for revision).

### 3. Application Structure

*   **`/src/app/`**: Next.js App Router root.
    *   **`/` (page.tsx)**: Login / Landing Page. Authenticates via `username`.
    *   **`/dashboard`**: High-level reporting metrics aggregated by Subbagian.
    *   **`/my-job`**: The core interactive view. Renders contextual tasks based on the logged-in user's role and assignments.
    *   **`/my-job/create`**: Task creation form (restricted to Ketua Tim) supporting `.pdf` assignment letter uploads.
    *   **`/my-job/[id]`**: Dynamic task details page. Rendering adapts heavily based on user role and current task status (e.g., showing Upload forms for Anggota, or Approve/Reject buttons for Subkoordinator).
    *   **`/admin`**: User management panel (bulk import, table views, editing credentials).
    *   **`/profile`**: Self-service user profile configuration.
    *   **`/api/*`**: Next.js Route Handlers strictly serving JSON data, acting as the backend API communicating with Prisma. Includes explicit routing for authentication, file uploads (`/api/upload`), dashboards, task workflows, and notifications.

*   **`/src/components/`**: Reusable React components (e.g., `Navbar.tsx`, `UserRoleSwitcher.tsx`).
*   **`/src/lib/`**: Core utilities, primarily initializing the singular global Prisma Client instance (`prisma.ts`).
*   **`/public/`**: Static assets like logos and the user-uploaded file storage directory (`/uploads`).
*   **`/prisma/`**: 
    *   `schema.prisma`: The database schema definition linking Users, Tasks, Files, Reviews, and Notifications.

### 4. Authentication Mechanism
Authentication uses a mocked stateful session utilizing `localStorage` to securely store the `currentUserId` and a global Context (`UserProvider`) reacting to state changes. Users login via `username` and `password`.

## 📦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   This will run Prisma schema generation and push the schema to SQLite.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   *Note: Open `http://localhost:3000` with your browser to see the result.*
