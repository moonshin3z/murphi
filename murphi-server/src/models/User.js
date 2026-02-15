const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true
  },
  githubId: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  preferences: {
    currency: {
      type: String,
      default: 'MXN'
    },
    weekStartsOn: {
      type: Number,
      default: 1 // 0 = Domingo, 1 = Lunes
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    canvasUrl: {
      type: String,
      default: ''
    },
    canvasToken: {
      type: String,
      default: ''
    },
    canvasEnabled: {
      type: Boolean,
      default: false
    },
    canvasLastSync: {
      type: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
