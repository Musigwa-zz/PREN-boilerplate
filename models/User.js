export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      image: {
        type: DataTypes.STRING(100),
        defaultValue: null
      },
      resetToken: {
        type: DataTypes.TEXT
      },
      firstName: {
        type: DataTypes.STRING(500)
      },
      lastName: {
        type: DataTypes.STRING(100),
        defaultValue: null
      },
      phone: {
        type: DataTypes.STRING(100),
        defaultValue: null
      },
      isVerified: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    { tableName: "users" }
  );

  User.associate = models => {};
  return User;
};
