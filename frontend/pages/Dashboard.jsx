import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Bookmark, Settings, MessageSquare, User, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import UserAvatar from '../components/UserAvatar';
import ProfileModal from '../components/ProfileModal';
import CollaborationSpace from '../components/CollaborationSpace';
import './Dashboard.css';
import ProjectCard from '../components/ProjectCard';

function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { projects, bookmarkedProjects } = useProjects();
  
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [applicationTab, setApplicationTab] = useState('received');
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showCollaborationSpace, setShowCollaborationSpace] = useState(false);
  const [activeCollabProject, setActiveCollabProject] = useState(null);
  const [pendingCollabProjectId, setPendingCollabProjectId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch applications from backend
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/api/applications/received/${user.id}`);
        const result = await response.json();

        if (result.success && result.data) {
          const transformedApplications = result.data.map(app => ({
            ...app,
            id: app._id || app.id,
            appliedDate: new Date(app.createdAt).toISOString().split('T')[0]
          }));
          setApplications(transformedApplications);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user?.id]);

  // Handle navigation from notifications
  useEffect(() => {
    if (location.state) {
      const { tab, subTab } = location.state;
      if (tab) {
        setActiveTab(tab);
      }
      if (subTab) {
        setApplicationTab(subTab);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle pending collaboration space opening
  useEffect(() => {
    if (pendingCollabProjectId) {
      const updatedProject = projects.find(p => p.id === pendingCollabProjectId);
      if (updatedProject) {
        setActiveCollabProject(updatedProject);
        setShowCollaborationSpace(true);
        setPendingCollabProjectId(null);
      }
    }
  }, [pendingCollabProjectId, projects]);

  // Get applications for the current user
  const receivedApplications = applications.filter(app => applicationTab === 'received');
  const sentApplications = applications.filter(app => app.applicantId === user?.id);

  // Filter applications based on the selected tab
  const filteredApplications = applicationTab === 'received' ? receivedApplications : sentApplications;

  // Get real application counts
  const receivedApplicationsCount = receivedApplications.filter(app => app.status === 'PENDING').length;
  const sentApplicationsCount = sentApplications.length;

  // Get bookmarked projects
  const bookmarkedProjectsList = projects.filter(project => 
    bookmarkedProjects.includes(project.id)
  );

  // Function to handle accepting an application
  const handleAcceptApplication = async (applicationId) => {
    const application = applications.find(app => app.id === applicationId || app._id === applicationId);
    
    if (!application) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/applications/${applicationId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        // Update application status
        setApplications(prev => prev.map(app =>
          (app.id === applicationId || app._id === applicationId) 
            ? { ...app, status: 'ACCEPTED' } 
            : app
        ));

        // Show success toast
        setToast({
          show: true,
          message: `${application.applicantName} has been added to the project`,
          type: 'success'
        });

        // Set pending collaboration space opening
        setPendingCollabProjectId(application.projectId);

        // Hide toast after delay
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error accepting application:', error);
    }
  };

  // Function to handle rejecting an application
  const handleRejectApplication = async (applicationId) => {
    const application = applications.find(app => app.id === applicationId || app._id === applicationId);
    
    if (!application) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/applications/${applicationId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        // Update application status
        setApplications(prev => prev.map(app =>
          (app.id === applicationId || app._id === applicationId)
            ? { ...app, status: 'REJECTED' }
            : app
        ));

        // Show toast notification
        setToast({
          show: true,
          message: 'Application has been rejected',
          type: 'error'
        });

        // Hide toast after delay
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  // Function to handle viewing an applicant's profile
  const handleViewProfile = (applicantId) => {
    const application = applications.find(app => app.applicantId === applicantId);
    if (application && application.userDetails) {
      if (applicationTab === 'sent') {
        setSelectedUser(user);
      } else {
        setSelectedUser(application.userDetails);
      }
    }
  };

  // Function to close the profile modal
  const handleCloseProfileModal = () => {
    setSelectedUser(null);
  };

  // Function to handle downloading a resume
  const handleDownloadResume = (resumeUrl, applicantName) => {
    const fullUrl = `${apiBaseUrl}${resumeUrl}`;
    window.open(fullUrl, '_blank');
  };

  // Format date to relative time
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Map user role to display title
  const getRoleDisplayTitle = (role) => {
    const roleMap = {
      'founder': 'The Founder',
      'professional': 'The Professional',
      'investor': 'The Investor',
      'student': 'The Student'
    };
    return roleMap[role] || role || 'Developer';
  };

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Please sign in to access your dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 style={{ color: 'white' }}>Welcome back, {user.name}!</h1>
          <p style={{ color: 'white' }}>Here's what's happening with your projects</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          Bookmarked Projects
        </button>
        <button
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'bookmarks' && (
          <div className="projects-content">
            <span className="projects-count">{bookmarkedProjectsList.length} bookmarked projects</span>
            {bookmarkedProjectsList.length > 0 ? (
              <div className="projects-grid">
                {bookmarkedProjectsList.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={(project) => {
                      setActiveCollabProject(project);
                      setShowCollaborationSpace(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-bookmarks">
                <Bookmark size={48} />
                <h3>No Projects Bookmarked</h3>
                <p>Browse projects and bookmark the ones you're interested in to see them here.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'applications' && (
          <div className="applications-content">
            <h3>Application Management</h3>
            
            <div className="applications-tabs">
              <button 
                className={`app-tab ${applicationTab === 'received' ? 'active' : ''}`}
                onClick={() => setApplicationTab('received')}
              >
                Received ({receivedApplicationsCount})
              </button>
              <button 
                className={`app-tab ${applicationTab === 'sent' ? 'active' : ''}`}
                onClick={() => setApplicationTab('sent')}
              >
                Sent ({sentApplicationsCount})
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Loading applications...</div>
            ) : filteredApplications.length > 0 ? (
              <div className="applications-list">
                {filteredApplications.map(application => (
                  <div key={application.id} className="application-item">
                    <div className="applicant-info">
                      <UserAvatar 
                        user={{ name: application.applicantName }} 
                        size="medium"
                        className="applicant-avatar"
                      />
                      <div className="applicant-details">
                        <h4>{application.applicantName}</h4>
                        <p className="profile-title">{applicationTab === 'sent' ? (user.title || getRoleDisplayTitle(user.role)) : (user.title || 'Member')}</p>
                        <span>Applied {getRelativeTime(application.appliedDate)}</span>
                      </div>
                    </div>
                    
                    <div className="application-details">
                      <div className="application-project">
                        <p>{application.projectName}</p>
                        <span>{application.position} position</span>
                      </div>
                      
                      <div className="applicant-skills">
                        {application.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                      
                      <p className="application-message">
                        {application.message}
                      </p>
                    </div>
                    
                    <div className="application-status-actions">
                      <div className={`application-status status-${application.status.toLowerCase()}`}>
                        {application.status === 'PENDING' && <Clock size={16} />}
                        {application.status === 'ACCEPTED' && <CheckCircle size={16} />}
                        {application.status === 'REJECTED' && <XCircle size={16} />}
                        <span>{application.status}</span>
                      </div>
                      
                      <div className="application-actions">
                        <button 
                          className="view-profile-btn" 
                          onClick={() => handleViewProfile(application.applicantId)}
                        >
                          <User size={16} />
                          Profile
                        </button>
                        {application.hasResume && (
                          <button 
                            className="resume-btn" 
                            onClick={() => handleDownloadResume(application.resumeUrl, application.applicantName)}
                          >
                            <Download size={16} />
                            Resume
                          </button>
                        )}
                        
                        {application.status === 'PENDING' && applicationTab === 'received' && (
                          <div className="decision-actions">
                            <button 
                              className="accept-btn" 
                              onClick={() => handleAcceptApplication(application.id)}
                            >
                              Accept
                            </button>
                            <button 
                              className="reject-btn" 
                              onClick={() => handleRejectApplication(application.id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-applications">
                <p>No applications to display.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        </div>
      )}
      
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          onClose={handleCloseProfileModal}
        />
      )}
      
      {showCollaborationSpace && (
        <CollaborationSpace
          activeProject={activeCollabProject}
          onClose={() => setShowCollaborationSpace(false)}
          defaultTab="team"
        />
      )}
    </div>
  );
}

export default Dashboard;
