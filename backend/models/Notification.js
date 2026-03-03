import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['application', 'acceptance', 'rejection', 'team_update', 'project_update'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectName: {
    type: String,
    default: ''
  },
  applicantName: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  navigationPath: {
    type: String,
    default: '/dashboard'
  },
  navigationState: {
    tab: String,
    subTab: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
