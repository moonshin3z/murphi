const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date
  },
  totalProductiveDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Método para actualizar la racha
streakSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActiveDate) {
    this.currentStreak = 1;
    this.lastActiveDate = today;
    this.totalProductiveDays = 1;
  } else {
    const lastDate = new Date(this.lastActiveDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Mismo día, no hacer nada
      return this;
    } else if (diffDays === 1) {
      // Día consecutivo
      this.currentStreak += 1;
      this.totalProductiveDays += 1;
    } else {
      // Se rompió la racha
      this.currentStreak = 1;
      this.totalProductiveDays += 1;
    }

    this.lastActiveDate = today;
  }

  // Actualizar récord
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  return this;
};

module.exports = mongoose.model('Streak', streakSchema);
