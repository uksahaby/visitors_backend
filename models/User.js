// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const User = sequelize.define('User', {
//   username: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//   },
//   name: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   phone: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   role: {
//     type: DataTypes.STRING,
//     defaultValue: 'user',
//     allowNull: false,
//   },
// });

// module.exports = User;


// models/User.js

// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'user']],
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return User;
};