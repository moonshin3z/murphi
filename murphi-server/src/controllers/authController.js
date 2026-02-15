const getCurrentUser = (req, res) => {
  if (req.user) {
    // No enviar canvasToken al frontend
    const { canvasToken, ...safePreferences } = req.user.preferences.toObject
      ? req.user.preferences.toObject()
      : req.user.preferences;

    res.json({
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      preferences: safePreferences
    });
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al destruir sesión' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Sesión cerrada exitosamente' });
    });
  });
};

const updatePreferences = async (req, res) => {
  try {
    const { currency, weekStartsOn, notificationsEnabled } = req.body;

    if (currency) req.user.preferences.currency = currency;
    if (weekStartsOn !== undefined) req.user.preferences.weekStartsOn = weekStartsOn;
    if (notificationsEnabled !== undefined) req.user.preferences.notificationsEnabled = notificationsEnabled;

    await req.user.save();

    const { canvasToken, ...safePrefs } = req.user.preferences.toObject
      ? req.user.preferences.toObject()
      : req.user.preferences;

    res.json({
      message: 'Preferencias actualizadas',
      preferences: safePrefs
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar preferencias' });
  }
};

module.exports = {
  getCurrentUser,
  logout,
  updatePreferences
};
