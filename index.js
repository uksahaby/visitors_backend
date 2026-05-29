// // index.js
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const sequelize = require('./config/database');
// const userRoutes = require('./routes/userRoutes');
// const visitorRoutes = require('./routes/visitorRoutes');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'Uploads')));

// // Routes
// app.use('/api', userRoutes);
// app.use('/api/visitors', visitorRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: 'Server error', error: err.message });
// });

// const startServer = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connection has been established successfully.');

//     // Sync models with the database (associations are handled in database.js)
//     await sequelize.sync({ alter: true }); // Use { alter: true } to modify existing tables
//     console.log('Database synchronized.');

//     const PORT = process.env.PORT || 3000;
//     app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// };

// startServer();


// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  next();
});

// Serve static files from the Uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/audit-logs', auditRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    msg: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Database connection and sync
console.log('Attempting to connect to database...');
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database schema synced successfully.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  });

module.exports = app;