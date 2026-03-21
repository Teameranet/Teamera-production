# Teamera — Master Fix Prompts
> Consolidated from: UX_SYSTEM_FLOW_AUDIT.md · UX_FIX_PROMPTS.md · UX_AUDIT_REPORT.md · SYSTEM_ISSUES_AND_FIXES.md
> Priority order follows system flow impact. Each prompt is self-contained and ready to execute.

---

## PRIORITY ORDER

| # | ID | Severity | File(s) | Issue |
|---|-----|----------|---------|-------|
| 1 | FIX-01 | 🔴 Critical | `Dashboard.jsx` | Missing "My Projects" tab — core feature absent |
| 2 | FIX-02 | 🔴 Critical | `Navbar.jsx` | "+ New Project" button imported but never rendered |
| 3 | FIX-03 | 🔴 Critical | `Navbar.jsx` | Community link missing from all navigation |
| 4 | FIX-04 | 🔴 Critical | `App.jsx` | No route protection on /dashboard and /profile |
| 5 | FIX-05 | 🟠 High | `Dashboard.jsx` | Message button + quick stats missing from header |
| 6 | FIX-06 | 🟠 High | `Dashboard.jsx` | Bookmarked project click opens CollaborationSpace (wrong) |
| 7 | FIX-07 | 🟠 High | `Dashboard.jsx` | Accepting application auto-opens CollaborationSpace without consent |
| 8 | FIX-08 | 🟠 High | `Profile.jsx` | Projects tab has Edit/Delete/Leave management buttons (should be read-only) |
| 9 | FIX-09 | 🟠 High | `CollaborationSpace.jsx` | Member filter uses name string matching instead of ID |
| 10 | FIX-10 | 🟠 High | `Projects.jsx` | Owner controls (Edit/Delete) visible on public discovery page |
| 11 | FIX-11 | 🟠 High | `ProjectModal.jsx` | Applying closes the entire modal — user loses project context |
| 12 | FIX-12 | 🟠 High | `AuthModal.jsx` | "Forgot password" is a dead `href="#"` anchor |
| 13 | FIX-13 | 🟡 Medium | `Navbar.jsx` | Dashboard link only in dropdown — should be in primary nav |
| 14 | FIX-14 | 🟡 Medium | `Profile.jsx` | Dead code: defaultExperienceData + commented renderAchievements |
| 15 | FIX-15 | 🟡 Medium | `Profile.jsx` | Settings tab buttons do nothing (Privacy, Notifications) |
| 16 | FIX-16 | 🟡 Medium | `Dashboard.jsx` | Toast has no background color — invisible to user |
| 17 | FIX-17 | 🟡 Medium | `Home.jsx` | Hero right column is empty — .hero-visual JSX missing |
| 18 | FIX-18 | 🟡 Medium | `Community.jsx` | New Post / Like / Comment have no auth guard |
| 19 | FIX-19 | 🟡 Medium | `Hackathons.jsx` | Register/Join buttons have no auth check |
| 20 | FIX-20 | 🟡 Medium | `OnboardingModal.jsx` | Skip button is commented out — users are trapped |
| 21 | FIX-21 | 🟡 Medium | `NotificationContext.jsx` | JSX icon elements stored in state (not serializable) |
| 22 | FIX-22 | 🟡 Medium | `Dashboard.jsx` | Add "Upcoming Events" sidebar (spec requirement) |
| 23 | FIX-23 | 🔵 Low | `pages/` folder | Duplicate copy files pollute codebase |
| 24 | FIX-24 | 🔵 Low | `ProjectCard.jsx` | Share button only console.logs — no real action |
| 25 | FIX-25 | 🔵 Low | All modals | No keyboard focus trap or Escape key handler |
| 26 | FIX-26 | 🔵 Low | `App.css` | Inconsistent colors (3 different blues) and border radii |
| 27 | FIX-27 | 🔵 Low | All components | No loading skeletons — jarring blank screens |


---

## 🔴 CRITICAL FIXES

---

### FIX-01 — Add "My Projects" Tab to Dashboard as Default Tab

**Files:** `frontend/pages/Dashboard.jsx`, `frontend/pages/Dashboard.css`

**Current state:** Dashboard only has "Bookmarked Projects" and "Applications" tabs. There is zero section showing the user's owned or participating projects. `getUserProjects` already exists in ProjectContext and returns `{ owned: [], participating: [] }`.

**Fix prompt:**
```
In frontend/pages/Dashboard.jsx:

1. Change the default active tab:
   const [activeTab, setActiveTab] = useState('myprojects');

2. Add a "My Projects" sub-tab state:
   const [myProjectsTab, setMyProjectsTab] = useState('owned');

3. At the top of the component, get user projects from context:
   const { getUserProjects, ...rest } = useProjects();
   const userProjects = user ? getUserProjects(user.id) : { owned: [], participating: [] };

4. Add a new tab button as the FIRST tab in .dashboard-tabs:
   <button className={`tab-btn ${activeTab === 'myprojects' ? 'active' : ''}`} onClick={() => setActiveTab('myprojects')}>
     My Projects
   </button>

5. Add the tab content block before the existing bookmarks block:
   {activeTab === 'myprojects' && (
     <div className="myprojects-content">
       <div className="myprojects-subtabs">
         <button className={`subtab-btn ${myProjectsTab === 'owned' ? 'active' : ''}`} onClick={() => setMyProjectsTab('owned')}>
           Projects I Own ({userProjects.owned.length})
         </button>
         <button className={`subtab-btn ${myProjectsTab === 'participating' ? 'active' : ''}`} onClick={() => setMyProjectsTab('participating')}>
           Projects I'm In ({userProjects.participating.length})
         </button>
       </div>

       {myProjectsTab === 'owned' && (
         <div className="projects-grid">
           {userProjects.owned.length > 0 ? userProjects.owned.map(project => (
             <div key={project.id} className="myproject-card-wrapper">
               <ProjectCard project={project} isOwned={true}
                 onEdit={handleEditProject} onDelete={handleDeleteProject}
                 onClick={() => { setActiveCollabProject(project); setShowCollaborationSpace(true); }} />
               <button className="open-collab-btn" onClick={() => { setActiveCollabProject(project); setShowCollaborationSpace(true); }}>
                 Open Collaboration
               </button>
             </div>
           )) : (
             <div className="empty-myprojects">
               <p>You haven't created any projects yet.</p>
               <button className="create-project-cta" onClick={() => setShowCreateProject(true)}>+ New Project</button>
             </div>
           )}
         </div>
       )}

       {myProjectsTab === 'participating' && (
         <div className="projects-grid">
           {userProjects.participating.length > 0 ? userProjects.participating.map(project => (
             <div key={project.id} className="myproject-card-wrapper">
               <ProjectCard project={project} isParticipating={true} onLeave={handleLeaveProject}
                 onClick={() => { setActiveCollabProject(project); setShowCollaborationSpace(true); }} />
               <button className="open-collab-btn" onClick={() => { setActiveCollabProject(project); setShowCollaborationSpace(true); }}>
                 Open Collaboration
               </button>
             </div>
           )) : (
             <div className="empty-myprojects">
               <p>You haven't joined any projects yet.</p>
             </div>
           )}
         </div>
       )}
     </div>
   )}

6. Add state and handlers for project management:
   const [showCreateProject, setShowCreateProject] = useState(false);
   const handleEditProject = (project) => { /* open edit modal */ };
   const handleDeleteProject = (projectId) => { if (window.confirm('Delete this project?')) deleteProject(projectId); };
   const handleLeaveProject = (projectId) => { if (window.confirm('Leave this project?')) leaveProject(projectId, user.id); };

7. Import CreateProjectModal and render it at the bottom:
   import CreateProjectModal from '../components/CreateProjectModal';
   {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}

8. Import deleteProject and leaveProject from useProjects().

9. In Dashboard.css add:
   .myprojects-subtabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
   .subtab-btn { padding: 0.5rem 1.25rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-weight: 500; }
   .subtab-btn.active { border-color: #4f46e5; color: #4f46e5; background: #eef2ff; }
   .myproject-card-wrapper { position: relative; }
   .open-collab-btn { width: 100%; margin-top: 0.5rem; padding: 0.5rem; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
   .create-project-cta { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 1rem; }
```

---

### FIX-02 — Add "+ New Project" Button to Navbar

**Files:** `frontend/components/Navbar.jsx`, `frontend/components/Navbar.css`

**Current state:** `Plus` is imported from lucide-react and `onCreateProject` prop is received, but NO button is rendered in the JSX. The prop is wired in App.jsx but silently does nothing.

**Fix prompt:**
```
In frontend/components/Navbar.jsx:

1. In the desktop .desktop-actions div, BEFORE the notification button, add:
   {user && (
     <button className="create-project-btn" onClick={onCreateProject}>
       <Plus size={16} />
       New Project
     </button>
   )}

2. In the mobile menu authenticated section, add after the Messages button:
   <button className="mobile-create-btn" onClick={() => { onCreateProject(); setShowMobileMenu(false); }}>
     <Plus size={20} />
     New Project
   </button>

3. In Navbar.css add:
   .create-project-btn {
     display: flex; align-items: center; gap: 0.4rem;
     padding: 0.5rem 1rem; border: none; border-radius: 8px;
     background: linear-gradient(135deg, #4f46e5, #7c3aed);
     color: white; font-weight: 600; font-size: 0.875rem;
     cursor: pointer; transition: opacity 0.2s;
   }
   .create-project-btn:hover { opacity: 0.9; }
   .mobile-create-btn {
     display: flex; align-items: center; gap: 0.5rem;
     width: 100%; padding: 0.75rem 1rem; border: none; border-radius: 8px;
     background: linear-gradient(135deg, #4f46e5, #7c3aed);
     color: white; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem;
   }
```

---

### FIX-03 — Add Community Link to Navbar

**Files:** `frontend/components/Navbar.jsx`

**Current state:** Community page exists at `/community` and is in App.jsx routes, but has zero entry in the Navbar. It is only reachable via the Footer — extremely poor discoverability.

**Fix prompt:**
```
In frontend/components/Navbar.jsx:

1. In the desktop nav <ul className="nav-menu desktop-menu">, add after Hackathons:
   <li className="nav-item">
     <Link to="/community" className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}>
       Community
     </Link>
   </li>

2. In the mobile <ul className="mobile-nav-menu">, add after Hackathons:
   <li>
     <Link to="/community" className={location.pathname === '/community' ? 'active' : ''}
       onClick={() => setShowMobileMenu(false)}>
       Community
     </Link>
   </li>

Keep the Community link in the Footer as well — both locations are fine.
```

---

### FIX-04 — Add Route Protection for /dashboard and /profile

**Files:** `frontend/components/ProtectedRoute.jsx` (new), `frontend/App.jsx`

**Current state:** Both `/dashboard` and `/profile` are accessible without authentication. Dashboard renders broken empty states with null user. Profile has a manual `if (!user)` text check but no redirect.

**Fix prompt:**
```
1. Create frontend/components/ProtectedRoute.jsx:
   import { Navigate } from 'react-router-dom';
   import { useAuth } from '../context/AuthContext';

   function ProtectedRoute({ children, onAuthClick }) {
     const { user } = useAuth();
     if (!user) {
       // Redirect to home — App.jsx will handle showing AuthModal via onAuthClick
       return <Navigate to="/" replace />;
     }
     return children;
   }
   export default ProtectedRoute;

2. In frontend/App.jsx, import ProtectedRoute and wrap the dashboard and profile routes:
   import ProtectedRoute from './components/ProtectedRoute';

   // Change:
   <Route path="/dashboard" element={<Dashboard />} />
   <Route path="/profile" element={<Profile />} />

   // To:
   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
   <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

3. Remove the manual if (!user) return <div>Please sign in...</div> blocks from both
   Dashboard.jsx and Profile.jsx — the route guard handles this now.
```


---

## 🟠 HIGH PRIORITY FIXES

---

### FIX-05 — Add Message Button + Quick Stats to Dashboard Header

**Files:** `frontend/pages/Dashboard.jsx`, `frontend/pages/Dashboard.css`

**Current state:** Header only shows "Welcome back, [Name]!" with no action button. No stats overview exists. Spec requires a Message button top-right and 4 quick-stat cards.

**Fix prompt:**
```
In frontend/pages/Dashboard.jsx:

1. Update the .dashboard-header div to include a message button on the right:
   <header className="dashboard-header">
     <div className="header-content">
       <h1 style={{ color: 'white' }}>Welcome back, {user.name}!</h1>
       <p style={{ color: 'white' }}>Here's what's happening with your projects</p>
     </div>
     <div className="header-actions">
       <button className="message-header-btn" onClick={() => setShowCollaborationSpace(true)}>
         <MessageSquare size={18} />
         Messages
       </button>
     </div>
   </header>

2. After the header and before the tabs, add a stats row:
   <div className="dashboard-stats-row">
     <div className="stat-card">
       <span className="stat-icon">🚀</span>
       <span className="stat-number">{userProjects.owned.length}</span>
       <span className="stat-label">Active Projects</span>
     </div>
     <div className="stat-card">
       <span className="stat-icon">🤝</span>
       <span className="stat-number">{userProjects.participating.length}</span>
       <span className="stat-label">Projects Joined</span>
     </div>
     <div className="stat-card">
       <span className="stat-icon">📥</span>
       <span className="stat-number">{receivedApplications.length}</span>
       <span className="stat-label">Apps Received</span>
     </div>
     <div className="stat-card">
       <span className="stat-icon">📤</span>
       <span className="stat-number">{sentApplications.length}</span>
       <span className="stat-label">Apps Sent</span>
     </div>
   </div>

3. In Dashboard.css add:
   .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
   .header-actions { flex-shrink: 0; }
   .message-header-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem;
     background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
     color: white; border-radius: 8px; cursor: pointer; font-weight: 500; backdrop-filter: blur(4px); }
   .message-header-btn:hover { background: rgba(255,255,255,0.25); }
   .dashboard-stats-row { display: flex; gap: 1rem; padding: 1.5rem 2rem; flex-wrap: wrap; }
   .stat-card { flex: 1; min-width: 140px; background: white; border-radius: 12px;
     padding: 1.25rem; display: flex; flex-direction: column; align-items: center;
     gap: 0.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
   .stat-icon { font-size: 1.5rem; }
   .stat-number { font-size: 1.75rem; font-weight: 700; color: #1f2937; }
   .stat-label { font-size: 0.8rem; color: #6b7280; text-align: center; }
```

---

### FIX-06 — Fix Bookmarked Project Click — Open ProjectModal Not CollaborationSpace

**Files:** `frontend/pages/Dashboard.jsx`

**Current state:**
```js
onClick={(project) => {
  setActiveCollabProject(project);
  setShowCollaborationSpace(true);
}}
```
Bookmarked projects are ones the user wants to apply to — they are likely NOT team members. Opening CollaborationSpace is wrong.

**Fix prompt:**
```
In frontend/pages/Dashboard.jsx:

1. Add two new state variables:
   const [selectedBookmarkProject, setSelectedBookmarkProject] = useState(null);
   const [showProjectModal, setShowProjectModal] = useState(false);

2. Import ProjectModal:
   import ProjectModal from '../components/ProjectModal';

3. In the bookmarks tab, change the ProjectCard onClick:
   // REMOVE:
   onClick={(project) => { setActiveCollabProject(project); setShowCollaborationSpace(true); }}
   // REPLACE WITH:
   onClick={(project) => { setSelectedBookmarkProject(project); setShowProjectModal(true); }}

4. At the bottom of the component JSX (before closing div), add:
   {showProjectModal && selectedBookmarkProject && (
     <ProjectModal
       project={selectedBookmarkProject}
       onClose={() => { setShowProjectModal(false); setSelectedBookmarkProject(null); }}
     />
   )}
```

---

### FIX-07 — Remove Auto-Open of CollaborationSpace After Accepting Application

**Files:** `frontend/pages/Dashboard.jsx`

**Current state:** `handleAcceptApplication` sets `pendingCollabProjectId`, which triggers a `useEffect` that automatically opens CollaborationSpace. This interrupts the user's workflow mid-review.

**Fix prompt:**
```
In frontend/pages/Dashboard.jsx:

1. Remove the pendingCollabProjectId state entirely:
   // DELETE: const [pendingCollabProjectId, setPendingCollabProjectId] = useState(null);

2. Remove the useEffect that watches pendingCollabProjectId:
   // DELETE the entire useEffect block that contains:
   // if (pendingCollabProjectId) { ... setPendingCollabProjectId(null); }

3. In handleAcceptApplication, remove the line:
   // DELETE: setPendingCollabProjectId(application.projectId);

4. Replace it with a toast that includes an action button. Update the toast state shape:
   const [toast, setToast] = useState({ show: false, message: '', type: '', actionLabel: '', actionFn: null });

5. In handleAcceptApplication success block, set:
   const acceptedProject = projects.find(p => p.id === application.projectId);
   setToast({
     show: true,
     message: `${application.applicantName} has been added to the project`,
     type: 'success',
     actionLabel: 'Open Workspace',
     actionFn: () => { setActiveCollabProject(acceptedProject); setShowCollaborationSpace(true); }
   });

6. Update the toast JSX to render the action button:
   {toast.show && (
     <div className={`toast-notification ${toast.type}`}>
       <div className="toast-content">
         <div className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</div>
         <div className="toast-message">{toast.message}</div>
         {toast.actionLabel && (
           <button className="toast-action-btn" onClick={() => { toast.actionFn(); setToast({ show: false }); }}>
             {toast.actionLabel}
           </button>
         )}
       </div>
     </div>
   )}

7. In Dashboard.css add:
   .toast-action-btn { margin-left: 1rem; padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2);
     border: 1px solid rgba(255,255,255,0.4); color: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
```

---

### FIX-08 — Make Profile Projects Tab Read-Only (Remove Management Controls)

**Files:** `frontend/pages/Profile.jsx`

**Current state:** Profile's Projects tab renders `isOwned={true}`, `onEdit`, `onDelete`, `isParticipating={true}`, `onLeave`, and stage change dropdowns. Profile should be a public portfolio view — management belongs in Dashboard.

**Fix prompt:**
```
In frontend/pages/Profile.jsx, inside the renderProjects() function:

1. For "Projects You Own" ProjectCard renders, remove these props:
   isOwned={true}, onEdit={handleEditProject}, onDelete={handleDeleteProject}
   Replace with a read-only view button and a collaboration button:
   <ProjectCard project={project} onClick={() => handleViewProject(project)} />
   <button className="profile-collab-btn" onClick={() => handleOpenCollaboration(project)}>
     Open Collaboration
   </button>
   <p className="manage-hint">To edit or delete, go to Dashboard → My Projects</p>

2. For "Projects You're Participating In" ProjectCard renders, remove:
   isParticipating={true}, onLeave={handleLeaveProject}
   Replace with:
   <ProjectCard project={project} onClick={() => handleViewProject(project)} />
   <button className="profile-collab-btn" onClick={() => handleOpenCollaboration(project)}>
     Open Collaboration
   </button>

3. Add the handleOpenCollaboration handler. Since Profile doesn't own CollaborationSpace state,
   navigate to Dashboard with state to trigger it:
   const navigate = useNavigate(); // import useNavigate from react-router-dom
   const handleOpenCollaboration = (project) => {
     navigate('/dashboard', { state: { openCollab: true, projectId: project.id } });
   };

4. Remove the now-unused functions from Profile.jsx:
   handleEditProject, handleDeleteProject, handleLeaveProject, handleStageChange, editingProjectStage state.
   Also remove imports: updateProjectStage, editProject, deleteProject, leaveProject from useProjects().

5. In Profile.css add:
   .profile-collab-btn { width: 100%; padding: 0.5rem; margin-top: 0.5rem;
     background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
   .manage-hint { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; text-align: center; }

6. In Dashboard.jsx, handle the navigation state to open CollaborationSpace:
   useEffect(() => {
     if (location.state?.openCollab && location.state?.projectId) {
       const project = projects.find(p => p.id === location.state.projectId);
       if (project) { setActiveCollabProject(project); setShowCollaborationSpace(true); }
       window.history.replaceState({}, document.title);
     }
   }, [location.state, projects]);
```

---

### FIX-09 — Fix CollaborationSpace Member Filter — Use ID Not Name

**Files:** `frontend/components/CollaborationSpace.jsx`

**Current state:**
```js
const userProjects = projects.filter(project =>
  project.teamMembers.some(member => member.name === user?.name)
);
```
Name-based matching breaks when two users share a name or a user changes their display name.

**Fix prompt:**
```
In frontend/components/CollaborationSpace.jsx:

1. Replace the userProjects filter:
   // REMOVE:
   const userProjects = projects.filter(project =>
     project.teamMembers.some(member => member.name === user?.name)
   );

   // REPLACE WITH:
   const userProjects = projects.filter(project =>
     project.teamMembers.some(member => {
       const memberId = member.userId || member.id || member._id;
       const userId = user?.id || user?._id;
       return memberId && userId && memberId.toString() === userId.toString();
     })
   );

2. Fix the isOwner check (same file):
   // REMOVE:
   const isOwner = selectedProject ?
     selectedProject.teamMembers.some(member =>
       member.name === user?.name && (member.role === 'Founder' || member.role === 'OWNER')
     ) : false;

   // REPLACE WITH:
   const isOwner = selectedProject ?
     selectedProject.teamMembers.some(member => {
       const memberId = member.userId || member.id || member._id;
       const userId = user?.id || user?._id;
       return memberId && userId && memberId.toString() === userId.toString()
         && (member.role === 'Founder' || member.role === 'OWNER');
     }) : false;

3. Fix the isAdmin check the same way — replace name comparison with ID comparison.

4. Add an empty state when userProjects is empty:
   {userProjects.length === 0 && !activeProject && (
     <div className="collab-empty-state">
       <p>You're not a member of any projects yet.</p>
       <a href="/projects">Browse Projects</a>
     </div>
   )}
```

---

### FIX-10 — Remove Owner Controls from Public Projects Discovery Page

**Files:** `frontend/pages/Projects.jsx`

**Current state:** The Projects page passes `isOwned`, `onEdit`, `onDelete` to ProjectCard, showing management buttons on a public discovery page. Also has a "Your Projects" collapsible section that mixes management into discovery.

**Fix prompt:**
```
In frontend/pages/Projects.jsx:

1. Remove the showOwnedProjects state and the entire "Your Projects" collapsible section JSX.
   That section belongs in Dashboard → My Projects tab (FIX-01).

2. When rendering ProjectCard in the discovery grid, only pass:
   <ProjectCard key={project.id} project={project} onClick={() => handleProjectClick(project)} />
   Do NOT pass: isOwned, onEdit, onDelete, isParticipating, onLeave.

3. Remove the handleDeleteProject and handleEditProject functions from Projects.jsx entirely.

4. Remove unused imports: Edit, Trash2 (and any others no longer used after this change).

5. The Projects page should be purely: browse → click → view ProjectModal → apply.
   All management actions live in Dashboard only.
```

---

### FIX-11 — Fix Application Submission — Don't Close the Project Modal

**Files:** `frontend/components/ProjectModal.jsx`

**Current state:** After submitting an application, a 2-second toast fires then `onClose()` is called — ejecting the user from the project they were viewing with no confirmation or next-step guidance.

**Fix prompt:**
```
In frontend/components/ProjectModal.jsx, in handleApplicationSubmit (or equivalent submit handler):

1. After successful submission, do NOT call onClose(). Instead:
   - Call setShowApplicationForm(false) to close only the application form overlay.
   - Set a new state: const [applicationSent, setApplicationSent] = useState(false);
   - Set applicationSent(true) after success.

2. In the positions tab render, when applicationSent is true, show a success state instead of the form:
   {applicationSent ? (
     <div className="application-success">
       <span>✓</span>
       <p>Your application was sent. You'll be notified when the owner responds.</p>
       <button onClick={() => navigate('/dashboard', { state: { tab: 'applications', subTab: 'sent' } })}>
         View My Applications
       </button>
     </div>
   ) : (
     // existing positions list
   )}

3. Import useNavigate from react-router-dom if not already imported.

4. Only call onClose() when the user explicitly clicks the X button or the backdrop.
```

---

### FIX-12 — Implement Forgot Password Flow

**Files:** `frontend/components/AuthModal.jsx`

**Current state:** "Forgot password?" is `<a href="#">` — a dead link. No reset flow exists anywhere.

**Fix prompt:**
```
In frontend/components/AuthModal.jsx:

1. Add state: const [isResetMode, setIsResetMode] = useState(false);
   Add state: const [resetEmail, setResetEmail] = useState('');
   Add state: const [resetSent, setResetSent] = useState(false);

2. Replace <a href="#">Forgot password?</a> with:
   <button type="button" className="forgot-link" onClick={() => setIsResetMode(true)}>
     Forgot password?
   </button>

3. When isResetMode is true, render a reset view instead of the login form:
   {isResetMode ? (
     <div className="reset-view">
       {resetSent ? (
         <p className="reset-success">Check your email for a reset link.</p>
       ) : (
         <>
           <h3>Reset your password</h3>
           <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
             placeholder="Enter your email" className="auth-input" />
           <button className="auth-submit-btn" onClick={handleSendReset}>Send Reset Link</button>
         </>
       )}
       <button type="button" className="back-to-login" onClick={() => { setIsResetMode(false); setResetSent(false); }}>
         ← Back to Sign In
       </button>
     </div>
   ) : (
     // existing login form
   )}

4. Add the handler:
   const handleSendReset = async () => {
     try {
       const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
       await fetch(`${apiBaseUrl}/api/users/forgot-password`, {
         method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: resetEmail })
       });
       setResetSent(true); // Show success regardless (security best practice)
     } catch (err) {
       setResetSent(true); // Same — don't reveal if email exists
     }
   };
```

