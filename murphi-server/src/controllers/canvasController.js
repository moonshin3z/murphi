const canvasService = require('../services/canvasService');
const User = require('../models/User');

const connectCanvas = async (req, res) => {
  try {
    const { canvasUrl, canvasToken } = req.body;

    if (!canvasUrl || !canvasToken) {
      return res.status(400).json({ error: 'Se requiere URL de Canvas y token' });
    }

    // Limpiar URL (quitar https://, trailing slashes)
    const cleanUrl = canvasUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

    // Validar conexión
    const result = await canvasService.testConnection(cleanUrl, canvasToken);

    if (!result.valid) {
      return res.status(400).json({
        error: 'No se pudo conectar con Canvas. Verifica tu URL y token.',
        details: result.error
      });
    }

    // Guardar en preferencias del usuario
    req.user.preferences.canvasUrl = cleanUrl;
    req.user.preferences.canvasToken = canvasToken;
    req.user.preferences.canvasEnabled = true;
    await req.user.save();

    res.json({
      message: 'Canvas conectado exitosamente',
      canvasUser: result.user
    });
  } catch (error) {
    console.error('Error connecting Canvas:', error);
    res.status(500).json({ error: 'Error al conectar con Canvas' });
  }
};

const disconnectCanvas = async (req, res) => {
  try {
    req.user.preferences.canvasUrl = '';
    req.user.preferences.canvasToken = '';
    req.user.preferences.canvasEnabled = false;
    req.user.preferences.canvasLastSync = undefined;
    await req.user.save();

    res.json({ message: 'Canvas desconectado' });
  } catch (error) {
    console.error('Error disconnecting Canvas:', error);
    res.status(500).json({ error: 'Error al desconectar Canvas' });
  }
};

const syncCanvas = async (req, res) => {
  try {
    const { canvasUrl, canvasToken, canvasEnabled } = req.user.preferences;

    if (!canvasEnabled || !canvasUrl || !canvasToken) {
      return res.status(400).json({ error: 'Canvas no está conectado' });
    }

    const result = await canvasService.syncAssignments(
      req.user._id,
      canvasUrl,
      canvasToken
    );

    // Actualizar última sincronización
    req.user.preferences.canvasLastSync = new Date();
    await req.user.save();

    res.json({
      message: 'Sincronización completada',
      ...result
    });
  } catch (error) {
    console.error('Error syncing Canvas:', error);
    res.status(500).json({ error: 'Error al sincronizar con Canvas' });
  }
};

const getCanvasStatus = async (req, res) => {
  try {
    const { canvasUrl, canvasEnabled, canvasLastSync } = req.user.preferences;

    res.json({
      connected: canvasEnabled || false,
      canvasUrl: canvasUrl || '',
      lastSync: canvasLastSync || null
    });
  } catch (error) {
    console.error('Error getting Canvas status:', error);
    res.status(500).json({ error: 'Error al obtener estado de Canvas' });
  }
};

module.exports = {
  connectCanvas,
  disconnectCanvas,
  syncCanvas,
  getCanvasStatus
};
