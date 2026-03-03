import express from "express";
import helloController from "../controllers/helloController.js";
import contactController from "../controllers/contactController.js";
import userController from "../controllers/userController.js";
import dashboardController from "../controllers/dashboardController.js";
import projectController from "../controllers/projectController.js";
import applicationController from "../controllers/applicationController.js";
import { logger } from "../../middleware/auth.js";
import { validateRegistration } from "../../middleware/validation.js";
import upload from "../../middleware/upload.js";
import Notification from "../../models/Notification.js";

const router = express.Router();

// Apply logging middleware to all API routes
router.use(logger);

// Hello endpoint
router.get("/hello", helloController.getHello);

// Contact endpoints
router.post("/contact", contactController.submitContact);

// User endpoints
router.post("/users/login", userController.loginUser);
router.post("/users/verify-email", userController.verifyUserByEmail);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.get("/users/:id/profile", userController.getUserProfile);
router.get("/users/:id/projects", userController.getUserProjects);
router.post("/users", validateRegistration, userController.createUser);
router.put("/users/:id", userController.updateUser);
router.put("/users/:id/profile", userController.updateUserProfile);
router.delete("/users/:id", userController.deleteUser);

// Dashboard endpoints
router.get("/dashboard/:userId", dashboardController.getDashboard);
router.get("/dashboard/:userId/stats", dashboardController.getDashboardStats);
router.get("/dashboard/:userId/bookmarks", dashboardController.getBookmarkedProjects);
router.get("/dashboard/:userId/applications", dashboardController.getApplications);
router.post("/dashboard/:userId/bookmarks", dashboardController.addBookmark);
router.delete("/dashboard/:userId/bookmarks/:projectId", dashboardController.removeBookmark);
router.post("/dashboard/:userId/applications", dashboardController.addApplication);
router.put("/dashboard/:userId/applications/:applicationId", dashboardController.updateApplicationStatus);

// Project endpoints
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:id", projectController.getProjectById);
router.post("/projects", projectController.createProject);
router.put("/projects/:id", projectController.updateProject);
router.delete("/projects/:id", projectController.deleteProject);
router.get("/projects/user/:userId", projectController.getUserProjects);
router.put("/projects/:id/stage", projectController.updateProjectStage);
router.post("/projects/:id/team", projectController.addTeamMember);
router.delete("/projects/:id/team/:userId", projectController.removeTeamMember);

// Application endpoints
router.post("/applications", upload.single('resume'), applicationController.submitApplication);
router.get("/applications/project/:projectId", applicationController.getProjectApplications);
router.get("/applications/user/:userId", applicationController.getUserApplications);
router.get("/applications/received/:userId", applicationController.getReceivedApplications);
router.get("/applications/:applicationId", applicationController.getApplicationById);
router.put("/applications/:applicationId/accept", applicationController.acceptApplication);
router.put("/applications/:applicationId/reject", applicationController.rejectApplication);
router.delete("/applications/:applicationId", applicationController.deleteApplication);

// Notification endpoints
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

router.put("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
});

router.put("/notifications/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

router.delete("/notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Clean React Architecture API",
    version: "1.0.0",
    endpoints: {
      hello: "GET /api/hello",
      contact: "POST /api/contact",
      users: {
        login: "POST /api/users/login",
        verifyEmail: "POST /api/users/verify-email",
        getAll: "GET /api/users",
        getById: "GET /api/users/:id",
        getProjects: "GET /api/users/:id/projects",
        getProfile: "GET /api/users/:id/profile",
        create: "POST /api/users",
        update: "PUT /api/users/:id",
        updateProfile: "PUT /api/users/:id/profile",
        delete: "DELETE /api/users/:id",
      },
      dashboard: {
        get: "GET /api/dashboard/:userId",
        getStats: "GET /api/dashboard/:userId/stats",
        getBookmarks: "GET /api/dashboard/:userId/bookmarks",
        getApplications: "GET /api/dashboard/:userId/applications",
        addBookmark: "POST /api/dashboard/:userId/bookmarks",
        removeBookmark: "DELETE /api/dashboard/:userId/bookmarks/:projectId",
        addApplication: "POST /api/dashboard/:userId/applications",
        updateApplicationStatus: "PUT /api/dashboard/:userId/applications/:applicationId",
      },
      projects: {
        getAll: "GET /api/projects",
        getById: "GET /api/projects/:id",
        create: "POST /api/projects",
        update: "PUT /api/projects/:id",
        delete: "DELETE /api/projects/:id",
        getUserProjects: "GET /api/projects/user/:userId",
        updateStage: "PUT /api/projects/:id/stage",
        addTeamMember: "POST /api/projects/:id/team",
        removeTeamMember: "DELETE /api/projects/:id/team/:userId",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;