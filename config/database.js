// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: process.env.DB_DIALECT,
//     logging: false, // Set to true for debugging
//   }
// );

// // Test the connection
// sequelize.authenticate()
//   .then(() => console.log('Database connection established successfully.'))
//   .catch((err) => console.error('Unable to connect to the database:', err));

// module.exports = sequelize;

// config/database.js

// config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Use DATABASE_URL if available (Render/Heroku style), else fallback to individual vars
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      protocol: "postgres",
      logging: false,
      dialectOptions: {
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: "postgres",
        logging: false,
      },
    );

module.exports = { sequelize };
