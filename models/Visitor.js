// models/Visitor.js
module.exports = (sequelize, DataTypes) => {
  const Visitor = sequelize.define('Visitor', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.UUID,
      references: {
        model: 'Events',
        key: 'id',
      },
    },
    image: {
      type: DataTypes.STRING,
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    addedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    createdByUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verifiedByUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkedOutByUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    visitHistory: {
      // JSON array of { checkIn: ISO, checkOut: ISO|null } records
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  });

  return Visitor;
};