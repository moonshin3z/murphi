const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  estimatedTime: {
    type: Number,  // minutos
    default: 0
  },
  source: {
    type: String,
    enum: ['manual', 'canvas'],
    default: 'manual'
  },
  canvasId: {
    type: Number,
    sparse: true
  },
  courseName: {
    type: String,
    default: ''
  },
  manuallyCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, canvasId: 1 });

module.exports = mongoose.model('Task', taskSchema);
