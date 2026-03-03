import { createContext, useContext, useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    // Store notifications by userId
    const [userNotifications, setUserNotifications] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Fetch notifications from backend when user changes
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.id) {
                setUserNotifications({});
                return;
            }

            try {
                const response = await fetch(`${apiBaseUrl}/api/notifications/${user.id}`);
                const result = await response.json();

                if (result.success && result.data) {
                    // Transform backend notifications to match frontend format
                    const transformedNotifications = result.data.map(notif => ({
                        id: notif._id || notif.id,
                        type: notif.type,
                        icon: getIconForType(notif.type),
                        title: notif.title,
                        time: getRelativeTime(notif.createdAt),
                        color: getColorForType(notif.type),
                        read: notif.read,
                        projectName: notif.projectName,
                        applicantName: notif.applicantName,
                        position: notif.position,
                        navigationPath: notif.navigationPath,
                        navigationState: notif.navigationState
                    }));

                    setUserNotifications({
                        [user.id]: transformedNotifications
                    });
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [user?.id]);

    // Helper function to get icon for notification type
    const getIconForType = (type) => {
        switch (type) {
            case 'application':
                return <Users size={16} />;
            case 'acceptance':
                return <CheckCircle size={16} />;
            case 'rejection':
                return <XCircle size={16} />;
            default:
                return <Users size={16} />;
        }
    };

    // Helper function to get color for notification type
    const getColorForType = (type) => {
        switch (type) {
            case 'application':
                return '#10b981';
            case 'acceptance':
                return '#10b981';
            case 'rejection':
                return '#ef4444';
            default:
                return '#10b981';
        }
    };

    // Helper function to get relative time
    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    // Get notifications for current user
    const getNotificationsForUser = (userId) => {
        return userNotifications[userId] || [];
    };

    // Update unread count for current user
    const updateUnreadCount = (userId) => {
        const notifications = getNotificationsForUser(userId);
        setUnreadCount(notifications.filter(n => !n.read).length);
    };

    // Update unread count when user changes
    useEffect(() => {
        if (user?.id) {
            updateUnreadCount(user.id);
        } else {
            setUnreadCount(0);
        }
    }, [user, userNotifications]);

    // Add new application notification (for specific project owner)
    const addApplicationNotification = (projectOwnerId, projectName, applicantName) => {
        console.log(`Adding application notification for user ${projectOwnerId}: ${applicantName} applied to ${projectName}`);
        
        const newNotification = {
            id: Date.now(),
            type: 'application',
            icon: <Users size={16} />,
            title: `New application received for '${projectName}' project`,
            time: 'Just now',
            color: '#10b981',
            read: false,
            projectName,
            applicantName,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'received' }
        };

        setUserNotifications(prev => {
            const updated = {
                ...prev,
                [projectOwnerId]: [newNotification, ...(prev[projectOwnerId] || [])]
            };
            console.log(`Updated notifications for user ${projectOwnerId}:`, updated[projectOwnerId]);
            return updated;
        });
    };

    // Add acceptance notification (for specific applicant)
    const addAcceptanceNotification = (applicantId, projectName, position) => {
        const newNotification = {
            id: Date.now(),
            type: 'acceptance',
            icon: <CheckCircle size={16} />,
            title: `You had '${projectName} & ${position}' successfully accepted`,
            time: 'Just now',
            color: '#10b981',
            read: false,
            projectName,
            position,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'sent' }
        };

        setUserNotifications(prev => ({
            ...prev,
            [applicantId]: [newNotification, ...(prev[applicantId] || [])]
        }));
    };

    // Add rejection notification (for specific applicant)
    const addRejectionNotification = (applicantId, projectName, position) => {
        const newNotification = {
            id: Date.now(),
            type: 'rejection',
            icon: <XCircle size={16} />,
            title: `Your application for '${projectName} & ${position}' was not accepted`,
            time: 'Just now',
            color: '#ef4444',
            read: false,
            projectName,
            position,
            navigationPath: '/dashboard',
            navigationState: { tab: 'applications', subTab: 'sent' }
        };

        setUserNotifications(prev => ({
            ...prev,
            [applicantId]: [newNotification, ...(prev[applicantId] || [])]
        }));
    };

    // Mark notification as read for current user
    const markAsRead = async (notificationId) => {
        if (!user?.id) return;

        try {
            await fetch(`${apiBaseUrl}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setUserNotifications(prev => ({
                ...prev,
                [user.id]: (prev[user.id] || []).map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            }));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read for current user
    const markAllAsRead = async () => {
        if (!user?.id) return;

        try {
            await fetch(`${apiBaseUrl}/api/notifications/${user.id}/read-all`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setUserNotifications(prev => ({
                ...prev,
                [user.id]: (prev[user.id] || []).map(notification => ({ ...notification, read: true }))
            }));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Remove notification for current user
    const removeNotification = async (notificationId) => {
        if (!user?.id) return;

        try {
            await fetch(`${apiBaseUrl}/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            setUserNotifications(prev => ({
                ...prev,
                [user.id]: (prev[user.id] || []).filter(notification => notification.id !== notificationId)
            }));
        } catch (error) {
            console.error('Error removing notification:', error);
        }
    };

    // Get current user's notifications
    const notifications = user?.id ? getNotificationsForUser(user.id) : [];

    const value = {
        notifications,
        unreadCount,
        addApplicationNotification,
        addAcceptanceNotification,
        addRejectionNotification,
        markAsRead,
        markAllAsRead,
        removeNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};