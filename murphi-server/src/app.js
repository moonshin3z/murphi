require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finances');
const productivityRoutes = require('./routes/productivity');
const aiRoutes = require('./routes/ai');
const timelineRoutes = require('./routes/timeline');
const canvasRoutes = require('./routes/canvas');

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas
app.use('/auth', authRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/canvas', canvasRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor Murphi corriendo en puerto ${PORT}`);
});
