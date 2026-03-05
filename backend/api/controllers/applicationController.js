import Application from '../../models/Application.js';
import Project from '../../models/Project.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import {
  successResponse,
  errorResponse,
  asyncHandler,
} from '../../utils/helpers.js';

const applicationController = {
  // Submit a new application
  submitApplication: asyncHandler(async (req, res) => {
    const {
      projectId,
      projectName,
      applicantId,
      applicantName,
      applicantAvatar,
      applicantColor,
      position,
      message,
      skills,
      userDetails
    } = req.body;

    // Validate required fields
    if (!projectId || !applicantId || !position) {
      return res
        .status(400)
        .json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      projectId,
      applicantId,
      position
    });

    if (existingApplication) {
      return res
        .status(400)
        .json(errorResponse('You have already applied for this position', 'ALREADY_APPLIED'));
    }

    // Handle file upload
    const hasResume = !!req.file;
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : '';

    // Create new application
    const newApplication = await Application.create({
      projectId,
      projectName: projectName || project.title,
      applicantId,
      applicantName,
      applicantAvatar,
      applicantColor,
      position,
      message,
      skills: skills || [],
      hasResume,
      resumeUrl,
      userDetails: userDetails || {},
      status: 'PENDING'
    });

    // Update project application count
    project.applications = (project.applications || 0) + 1;
    await project.save();

    // Create notification for project owner
    await Notification.create({
      userId: project.ownerId,
      type: 'application',
      title: `New application received for '${project.title}' project`,
      message: `${applicantName} applied for the ${position} position`,
      projectId: project._id,
      projectName: project.title,
      applicantName,
      position,
      navigationPath: '/dashboard',
      navigationState: {
        tab: 'applications',
        subTab: 'received'
      }
    });

    const response = successResponse(newApplication, 'Application submitted successfully');
    res.status(201).json(response);
  }),

  // Get all applications for a project
  getProjectApplications: asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.query;

    const filter = { projectId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('applicantId', 'name email avatar')
      .sort({ createdAt: -1 });

    const response = successResponse(applications, 'Applications retrieved successfully');
    res.json(response);
  }),

  // Get applications by user (sent applications)
  getUserApplications: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;

    const filter = { applicantId: userId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('projectId', 'title description stage industry')
      .sort({ createdAt: -1 });

    const response = successResponse(applications, 'User applications retrieved successfully');
    res.json(response);
  }),

  // Get applications received by user (for their projects)
  getReceivedApplications: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;

    // Find all projects owned by the user
    const userProjects = await Project.find({ ownerId: userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const filter = { projectId: { $in: projectIds } };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('applicantId', 'name email avatar')
      .populate('projectId', 'title description stage industry')
      .sort({ createdAt: -1 });

    const response = successResponse(applications, 'Received applications retrieved successfully');
    res.json(response);
  }),

  // Accept an application
  acceptApplication: asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res
        .status(404)
        .json(errorResponse('Application not found', 'APPLICATION_NOT_FOUND'));
    }

    if (application.status !== 'PENDING') {
      return res
        .status(400)
        .json(errorResponse('Application has already been processed', 'ALREADY_PROCESSED'));
    }

    // Update application status
    application.status = 'ACCEPTED';
    await application.save();

    // Add user to project team
    const project = await Project.findById(application.projectId);
    if (project) {
      // Check if user is already a team member
      const isAlreadyMember = project.teamMembers.some(
        member => member.id && member.id.toString() === application.applicantId.toString()
      );

      if (!isAlreadyMember) {
        project.teamMembers.push({
          id: application.applicantId,
          name: application.applicantName,
          role: application.position,
          avatar: application.applicantAvatar,
          email: application.userDetails?.email || '',
          applicantColor: application.applicantColor || '#4f46e5'
        });
        await project.save();
      }

      // Update user stats - increment connectionsHelped for project owner
      const projectOwner = await User.findById(project.ownerId);
      if (projectOwner) {
        // Add custom field for stats tracking
        if (!projectOwner.connectionsHelped) {
          projectOwner.connectionsHelped = 0;
        }
        projectOwner.connectionsHelped += 1;
        await projectOwner.save();
      }

      // Create acceptance notification for applicant
      await Notification.create({
        userId: application.applicantId,
        type: 'acceptance',
        title: `You had '${project.title} & ${application.position}' successfully accepted`,
        message: `Congratulations! Your application for ${application.position} position has been accepted`,
        projectId: project._id,
        projectName: project.title,
        position: application.position,
        navigationPath: '/dashboard',
        navigationState: {
          tab: 'applications',
          subTab: 'sent'
        }
      });
    }

    const response = successResponse(application, 'Application accepted successfully');
    res.json(response);
  }),

  // Reject an application
  rejectApplication: asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res
        .status(404)
        .json(errorResponse('Application not found', 'APPLICATION_NOT_FOUND'));
    }

    if (application.status !== 'PENDING') {
      return res
        .status(400)
        .json(errorResponse('Application has already been processed', 'ALREADY_PROCESSED'));
    }

    // Update application status
    application.status = 'REJECTED';
    await application.save();

    // Create rejection notification for applicant
    const project = await Project.findById(application.projectId);
    if (project) {
      await Notification.create({
        userId: application.applicantId,
        type: 'rejection',
        title: `Your application for '${project.title} & ${application.position}' was not accepted`,
        message: `Unfortunately, your application for ${application.position} position was not accepted`,
        projectId: project._id,
        projectName: project.title,
        position: application.position,
        navigationPath: '/dashboard',
        navigationState: {
          tab: 'applications',
          subTab: 'sent'
        }
      });
    }

    const response = successResponse(application, 'Application rejected successfully');
    res.json(response);
  }),

  // Get application by ID
  getApplicationById: asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('applicantId', 'name email avatar bio skills experiences education')
      .populate('projectId', 'title description stage industry');

    if (!application) {
      return res
        .status(404)
        .json(errorResponse('Application not found', 'APPLICATION_NOT_FOUND'));
    }

    const response = successResponse(application, 'Application retrieved successfully');
    res.json(response);
  }),

  // Delete an application
  deleteApplication: asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const application = await Application.findByIdAndDelete(applicationId);

    if (!application) {
      return res
        .status(404)
        .json(errorResponse('Application not found', 'APPLICATION_NOT_FOUND'));
    }

    const response = successResponse(
      { id: application._id },
      'Application deleted successfully'
    );
    res.json(response);
  })
};

export default applicationController;
