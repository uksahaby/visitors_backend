// models/index.js
const { Sequelize, DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Import models
const User = require('./User')(sequelize, DataTypes);
const Event = require('./Event')(sequelize, DataTypes);
const Visitor = require('./Visitor')(sequelize, DataTypes);
const AuditLog = require('./AuditLog')(sequelize, DataTypes);

// Define associations
Event.belongsTo(User, { foreignKey: 'createdBy', as: 'CreatedBy' });
Visitor.belongsTo(Event, { foreignKey: 'eventId', as: 'Event' });
Visitor.belongsTo(User, { foreignKey: 'addedBy', as: 'AddedBy' });
Event.hasMany(Visitor, { foreignKey: 'eventId', as: 'Visitors' });


// Export models
module.exports = {
  User,
  Event,
  Visitor,
  AuditLog,
  sequelize,
  Op,
};