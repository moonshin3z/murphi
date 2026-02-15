/**
 * Script para resetear completamente la base de datos
 * Elimina todos los datos de todas las colecciones
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Importar todos los modelos
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');
const SavingGoal = require('../src/models/SavingGoal');
const StudySession = require('../src/models/StudySession');
const Task = require('../src/models/Task');
const Streak = require('../src/models/Streak');
const TaskLog = require('../src/models/TaskLog');

const resetDatabase = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado!\n');

    console.log('Eliminando datos...\n');

    // Eliminar todos los documentos de cada colección
    const results = await Promise.all([
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      SavingGoal.deleteMany({}),
      StudySession.deleteMany({}),
      Task.deleteMany({}),
      Streak.deleteMany({}),
      TaskLog.deleteMany({}),
      User.deleteMany({})
    ]);

    console.log('Transacciones eliminadas:', results[0].deletedCount);
    console.log('Presupuestos eliminados:', results[1].deletedCount);
    console.log('Metas de ahorro eliminadas:', results[2].deletedCount);
    console.log('Sesiones de estudio eliminadas:', results[3].deletedCount);
    console.log('Tareas eliminadas:', results[4].deletedCount);
    console.log('Rachas eliminadas:', results[5].deletedCount);
    console.log('Registros de tareas eliminados:', results[6].deletedCount);
    console.log('Usuarios eliminados:', results[7].deletedCount);

    console.log('\n Base de datos reseteada exitosamente!');
    console.log('La app ahora está como nueva.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexión cerrada.');
    process.exit(0);
  }
};

resetDatabase();
