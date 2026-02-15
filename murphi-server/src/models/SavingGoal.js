const mongoose = require('mongoose');

const savingGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

savingGoalSchema.index({ userId: 1, status: 1 });

// Virtual para calcular progreso
savingGoalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 100;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

savingGoalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SavingGoal', savingGoalSchema);
