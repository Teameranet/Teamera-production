import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: {
    type: String,
    required: true
  },
  applicantAvatar: {
    type: String,
    default: ''
  },
  applicantColor: {
    type: String,
    default: '#4f46e5'
  },
  position: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  hasResume: {
    type: Boolean,
    default: false
  },
  resumeUrl: {
    type: String,
    default: ''
  },
  userDetails: {
    name: String,
    title: String,
    email: String,
    location: String,
    bio: String,
    skills: [String],
    experiences: [{
      company: String,
      position: String,
      duration: String
    }],
    education: [{
      institution: String,
      degree: String,
      year: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
applicationSchema.index({ projectId: 1, status: 1 });
applicationSchema.index({ applicantId: 1, status: 1 });
applicationSchema.index({ projectId: 1, applicantId: 1 });

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application;
