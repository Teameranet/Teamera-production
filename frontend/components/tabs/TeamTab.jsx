import { useState, useRef } from 'react';
import { Users, UserPlus, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import UserAvatar from '../UserAvatar';
import './Tabs.css';

function TeamTab({ project, isAdmin, isOwner }) {
  const { user } = useAuth();
  const { leaveProject } = useProjects();
  const [confirmingRemoval, setConfirmingRemoval] = useState(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const teamListRef = useRef(null);

  // Use actual project team members instead of hardcoded data
  const teamMembers = project?.teamMembers || [];

  const handleRemoveMember = async (memberId, memberName) => {
    if (!isAdmin || isProcessing) return;
    
    if (confirmingRemoval === memberId) {
      // Actually remove the member
      setIsProcessing(true);
      
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/projects/${project.id || project._id}/team/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          console.log('Member removed successfully:', memberName);
          // The project will be updated via polling or you can trigger a refresh
          window.location.reload(); // Simple refresh for now
        } else {
          alert('Failed to remove member: ' + result.message);
        }
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member. Please try again.');
      } finally {
        setIsProcessing(false);
        setConfirmingRemoval(null);
      }
    } else {
      // Ask for confirmation
      setConfirmingRemoval(memberId);
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setConfirmingRemoval(null);
      }, 3000);
    }
  };

  const handleLeaveProject = async () => {
    if (isOwner || isProcessing) return; // Owner cannot leave their own project
    
    if (confirmingLeave) {
      // Actually leave the project
      setIsProcessing(true);
      
      try {
        const success = await leaveProject(project.id || project._id, user.id);
        
        if (success) {
          console.log('Left project successfully');
          // Close the collaboration space or refresh
          window.location.reload();
        } else {
          alert('Failed to leave project. Please try again.');
        }
      } catch (error) {
        console.error('Error leaving project:', error);
        alert('Failed to leave project. Please try again.');
      } finally {
        setIsProcessing(false);
        setConfirmingLeave(false);
      }
    } else {
      // Ask for confirmation
      setConfirmingLeave(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setConfirmingLeave(false);
      }, 3000);
    }
  };

  const handleInviteMembers = () => {
    if (!isAdmin) return;
    // Invite members logic here
    console.log('Opening invite members modal');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'OWNER':
      case 'Founder':
        return '#4f46e5'; // Indigo
      case 'ADMIN':
        return '#2563eb'; // Blue
      case 'MEMBER':
        return '#6b7280'; // Gray
      default:
        return '#059669'; // Green for other positions
    }
  };

  const getDisplayRole = (role) => {
    // Map role to display name
    switch (role) {
      case 'OWNER':
      case 'Founder':
        return 'Founder';
      case 'ADMIN':
        return 'Admin';
      case 'MEMBER':
        return 'Member';
      default:
        return role; // Return the position name as is
    }
  };

  const getMemberEmail = (member) => member?.email || '';

  return (
    <div className="team-section">
      <div className="team-actions">
        {isAdmin && (
          <button className="invite-btn" onClick={handleInviteMembers}>
            <UserPlus size={20} />
            Invite Members
          </button>
        )}
        {!isOwner && (
          <button 
            className={`leave-project-btn ${confirmingLeave ? 'confirming' : ''}`}
            onClick={handleLeaveProject}
            disabled={isProcessing}
          >
            <LogOut size={20} />
            {confirmingLeave ? 'Confirm Leave?' : 'Leave Project'}
          </button>
        )}
      </div>

      <div ref={teamListRef} className="team-list scrollable">
        {teamMembers.length > 0 ? (
          teamMembers.map((member, index) => {
            // Safely extract ID - handle cases where id might be an object
            const memberId = typeof member.id === 'string' ? member.id : 
                             typeof member._id === 'string' ? member._id :
                             member.id?._id || member.id?.toString() || 
                             member._id?.toString() || 
                             `${member.name}-${member.role}-${index}`;
            
            return (
              <div key={memberId} className="member-item">
                <UserAvatar 
                  user={member} 
                  size="small" 
                  name={member.name}
                  color={member.avatar ? undefined : member.applicantColor}
                />
                <div className="member-info">
                  <h4>{member.name}</h4>
                  <p>{getMemberEmail(member) || member.email || 'No email provided'}</p>
                </div>
                <div 
                  className="member-role"
                  style={{
                    backgroundColor: getRoleColor(member.role),
                    opacity: member.role === 'MEMBER' ? 0.8 : 1
                  }}
                >
                  {getDisplayRole(member.role)}
                </div>
                {isAdmin && member.role !== 'OWNER' && member.role !== 'Founder' && (
                  <button 
                    className={`remove-member-btn ${confirmingRemoval === memberId ? 'confirming' : ''}`}
                    onClick={() => handleRemoveMember(memberId, member.name)}
                    disabled={isProcessing}
                    aria-label={confirmingRemoval === memberId ? "Confirm removal" : "Remove member"}
                  >
                    <X size={18} />
                    {confirmingRemoval === memberId && <span className="confirm-text">Confirm</span>}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-team">
            <Users size={48} />
            <h3>No Team Members Yet</h3>
            <p>Start building your team by inviting members or accepting applications.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamTab;