# 📁 Asset Structure & Image Placeholders Guide

## Folder Structure

```
frontend/src/assets/
├── collab-logo.png          ← Main logo (currently imported in 3 pages)
├── images/                  ← Product images, screenshots, decorative
│   ├── hero-banner.png
│   ├── feature-*.png
│   ├── workspace-preview.png
│   └── ...
├── icons/                   ← Custom icon assets (if not using Font Awesome)
│   ├── collaboration.svg
│   ├── secure.svg
│   ├── realtime.svg
│   └── ...
└── screenshots/             ← Demo screenshots, team photos
    ├── dashboard-demo.png
    ├── workspace-tour.png
    └── ...
```

---

## Current Placeholders by Location

### 1. **Logo** (40px - 48px)

| File       | Location           | Current                    | Purpose            |
| ---------- | ------------------ | -------------------------- | ------------------ |
| Home.jsx   | Navbar (line 83)   | `collab-logo.png`          | App logo in navbar |
| Home.jsx   | -                  | Uses `FaRocket` emoji icon | Branding           |
| Login.jsx  | Center (line ~23)  | `collab-logo.png`          | Auth page header   |
| Signup.jsx | Center (line ~117) | `collab-logo.png`          | Auth page header   |

**👉 Save your logo as:** `frontend/src/assets/collab-logo.png`

---

### 2. **Feature Icons** (Home.jsx hero section)

Currently using **Font Awesome icons** - can be replaced with custom SVG/PNG:

```jsx
// Line 47-62 in Home.jsx
{
  icon: FaUsers,        // "Team Collaboration"
  label: "Team Collaboration",
},
{
  icon: FaLock,         // "Secure & Private"
  label: "Secure & Private",
},
{
  icon: FaClock,        // "Real-time Sync"
  label: "Real-time Sync",
},
{
  icon: FaRocket,       // "Lightning Fast"
  label: "Lightning Fast",
}
```

**To replace with images:** Update `/images/` folder with:

- `team-collaboration.svg` (64x64px)
- `secure-private.svg` (64x64px)
- `realtime-sync.svg` (64x64px)
- `lightning-fast.svg` (64x64px)

---

### 3. **OAuth Icons** (Login/Signup pages)

Currently using Font Awesome:

- `FaGithub` (GitHub button)
- `FaGoogle` (Google button)

These are from libraries, but you can customize by adding custom SVGs:

- `frontend/src/assets/icons/github.svg`
- `frontend/src/assets/icons/google.svg`

---

### 4. **Navigation Icons** (DashboardNavbar & DashboardSidebar)

Using Font Awesome icons - all functional:

**Navbar Icons:**

- `FaArrowLeft` - Back button
- `FaHome` - Home button
- `FaPlus`, `FaEdit`, `FaTrash` - CRUD buttons

**Sidebar Icons:**

- `FaHome` - Overview
- `FaBriefcase` - Workspaces
- `FaUsers` - Team
- `FaComment` - Chat
- `FaTasks` - Tasks
- `FaFileAlt` - Documents
- `FaStickyNote` - Notes
- `FaGithub` - Repositories

---

### 5. **User Avatar** (DashboardNavbar)

| File                | Location             | Current                        |
| ------------------- | -------------------- | ------------------------------ |
| DashboardNavbar.jsx | User menu (line 124) | `user?.avatar` (from database) |

**To use real avatars:**

1. User uploads avatar during signup/profile
2. Stored in MongoDB as URL
3. Automatically displays in navbar

---

### 6. **Workspace Icons** (Dashboard cards)

Workspaces can have custom icons - currently showing default workspace name cards only.

**To add:** Add `icon` or `coverImage` field to Workspace model:

```javascript
{
  name: "Project X",
  description: "...",
  icon: "rocket", // or coverImage URL
  coverImage: "frontend/src/assets/images/workspace-preview.png"
}
```

---

### 7. **Team Photos** (Future Member Directory)

Create folder: `frontend/src/assets/images/team/`

- `john-doe.jpg`
- `jane-smith.jpg`
- etc.

---

## How to Replace Placeholders

### Option 1: Replace Existing Logo

1. Save your PNG/SVG as: **`frontend/src/assets/collab-logo.png`**
2. That's it! It auto-updates on all 3 pages (Home, Login, Signup)

### Option 2: Add Feature Icons (Custom SVGs)

1. Save SVGs to `frontend/src/assets/icons/`
2. Update Home.jsx (lines 47-62) to import and use them:

```jsx
import myTeamIcon from "../assets/icons/team-collaboration.svg";
import mySecurityIcon from "../assets/icons/secure-private.svg";

// Then replace: icon: FaUsers with icon: myTeamIcon
```

### Option 3: Add Hero Banner/Images

1. Save images to `frontend/src/assets/images/`
2. Create new image section in Home.jsx above features:

```jsx
<Image
  src={heroImage}
  alt="Dashboard preview"
  w="full"
  h="400px"
  objectFit="cover"
  borderRadius="12px"
/>
```

### Option 4: Add Workspace Preview Images

1. Save images to `frontend/src/assets/images/`
2. Update Backend Workspace model to include `coverImage` field
3. Display in workspace cards

---

## Image Optimization Tips

✅ **Recommended Formats:**

- **Logos:** PNG (transparent) or SVG
- **Icons:** SVG (scalable) or PNG
- **Photos:** JPEG (compressed) or WebP
- **Screenshots:** PNG or WebP

✅ **Size Recommendations:**

- Logo: 40-512px (will scale automatically)
- Feature icons: 64-128px
- Hero images: 1200x400px or higher
- Team photos: 200x200px

✅ **Tools to compress:**

- TinyPNG (png/jpg)
- SVG optimizers for SVGs
- ImageOptim (Mac) or FileOptimizer (Windows)

---

## File Locations Reference

| Asset                  | Current Path                | Use In                 |
| ---------------------- | --------------------------- | ---------------------- |
| Logo                   | `/assets/collab-logo.png`   | Home, Login, Signup    |
| Feature Icons          | Using Font Awesome          | Home.jsx features      |
| Feature Icons (custom) | `/assets/icons/*.svg`       | Can replace FA icons   |
| Team Images            | `/assets/images/team/`      | Profile pages (future) |
| Screenshots            | `/assets/screenshots/`      | Landing page demo      |
| Hero Banner            | `/assets/images/hero-*.png` | Home.jsx (to add)      |

---

## Next Steps

1. ✅ **Create your logo** as `collab-logo.png` (256x256px minimum)
2. ✅ **Save to:** `d:\collaborative-workspace\frontend\src\assets\collab-logo.png`
3. ✅ **Add other images** to appropriate subfolders
4. ✅ **Import and use** them in React components:
   ```jsx
   import myImage from "../assets/images/my-image.png";
   <Image src={myImage} alt="description" />;
   ```

---

## Current Placeholder Usage Summary

| Type                 | Using                                             | Count   | Location                 |
| -------------------- | ------------------------------------------------- | ------- | ------------------------ |
| **Logo**             | collab-logo.png                                   | 3       | Home, Login, Signup      |
| **Feature Icons**    | Font Awesome (FaRocket, FaUsers, FaLock, FaClock) | 4       | Home.jsx                 |
| **UI Icons**         | Font Awesome                                      | 10+     | Navbar, Sidebar, Buttons |
| **OAuth Icons**      | Font Awesome (FaGithub, FaGoogle)                 | 2       | Auth pages               |
| **User Avatar**      | Database URL                                      | Dynamic | DashboardNavbar          |
| **Workspace Images** | None (text only)                                  | —       | Dashboard cards          |
