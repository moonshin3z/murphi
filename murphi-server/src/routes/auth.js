const express = require('express');
const passport = require('passport');
const { getCurrentUser, logout, updatePreferences } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`
}), (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
});

// GitHub OAuth
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

router.get('/github/callback', passport.authenticate('github', {
  failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`
}), (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
});

// Rutas de usuario
router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.put('/preferences', isAuthenticated, updatePreferences);

module.exports = router;
