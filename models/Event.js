// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const Event = sequelize.define('Event', {
//   id: {
//     type: DataTypes.STRING,
//     primaryKey: true,
//   },
//   name: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   date: {
//     type: DataTypes.DATE,
//     allowNull: false,
//   },
// });

// module.exports = Event;


// models/Event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    createdByUsername: {
      type: DataTypes.STRING,
      allowNull: true
    },
    updatedByUsername: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {});

  Event.associate = function(models) {
    Event.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'CreatedBy'
    });
    Event.hasMany(models.Visitor, {
      foreignKey: 'eventId',
      as: 'Visitors'
    });
  };

  return Event;
};