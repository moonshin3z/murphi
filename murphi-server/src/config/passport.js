const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      return done(null, user);
    }

    // Verificar si existe un usuario con el mismo email
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Vincular cuenta de Google al usuario existente
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }

    // Crear nuevo usuario
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0]?.value
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/auth/github/callback',
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });

    if (user) {
      return done(null, user);
    }

    const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

    // Verificar si existe un usuario con el mismo email
    user = await User.findOne({ email });

    if (user) {
      // Vincular cuenta de GitHub al usuario existente
      user.githubId = profile.id;
      await user.save();
      return done(null, user);
    }

    // Crear nuevo usuario
    user = await User.create({
      githubId: profile.id,
      email,
      name: profile.displayName || profile.username,
      avatar: profile.photos[0]?.value
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

module.exports = passport;
