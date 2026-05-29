// models/AuditLog.js
module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. 'USER_LOGIN', 'USER_CREATE', etc.
    },
    operator: {
      type: DataTypes.STRING,
      allowNull: false, // Username of the executing actor, or 'System' / 'Anonymous'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT, // Storing serialized details/payload JSON for extreme portability and flexibility
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false, // 'SUCCESS' or 'FAILURE'
      defaultValue: 'SUCCESS',
    }
  });

  return AuditLog;
};
