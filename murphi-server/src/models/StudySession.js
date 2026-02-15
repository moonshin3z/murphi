const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  duration: {
    type: Number,  // minutos
    required: true,
    min: 1
  },
  pomodorosCompleted: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

studySessionSchema.index({ userId: 1, date: -1 });
studySessionSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
