const mongoose = require('mongoose');

const taskLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Estudio', 'Trabajo', 'Proyecto', 'Lectura', 'Ejercicio', 'Hobbies', 'Otros']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskLogSchema.index({ userId: 1, startTime: -1 });
taskLogSchema.index({ userId: 1, status: 1 });
taskLogSchema.index({ userId: 1, category: 1 });

// Virtual to calculate duration if endTime exists
taskLogSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return Math.floor((Date.now() - this.startTime) / 1000);
});

// Method to stop the task
taskLogSchema.methods.stop = function() {
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('TaskLog', taskLogSchema);
