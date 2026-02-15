const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'monthly'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [{
    name: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  alertThreshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

budgetSchema.index({ userId: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
