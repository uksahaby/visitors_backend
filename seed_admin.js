const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log("====================================================");
  printCentered("Baqi Visitors App - Neon Database Admin Seeder");
  console.log("====================================================\n");

  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log("No DATABASE_URL found in your local .env file.");
    const inputUrl = await askQuestion("Please paste your Neon PostgreSQL connection string:\n> ");
    dbUrl = inputUrl.trim();
  }

  if (!dbUrl) {
    console.log("Error: Connection string is required to seed the database.");
    rl.close();
    return;
  }

  console.log("\nAttempting to connect to your Neon Database...");

  // Initialize Sequelize with custom database connection URL and production SSL options
  const sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sequelize.authenticate();
    console.log("✅ Successfully connected to Neon PostgreSQL Database!");

    // Load User model
    const User = require('./models/User')(sequelize, DataTypes);

    // Sync database tables first (ensures the users table exists!)
    console.log("Syncing database schema...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database schema synchronized.");

    // Prompt for admin details
    console.log("\n--- Create Your Admin Account ---");
    const username = (await askQuestion("Enter Admin Username (default: admin): ")).trim() || "admin";
    const phone = (await askQuestion("Enter Admin Phone Number (default: 1234567890): ")).trim() || "1234567890";
    const password = (await askQuestion("Enter Admin Password (default: admin123): ")).trim() || "admin123";

    console.log("\nHashing password and inserting user into database...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert or update admin user
    const [adminUser, created] = await User.findOrCreate({
      where: { username: username },
      defaults: {
        phone: phone,
        password: hashedPassword,
        role: "admin",
        active: true
      }
    });

    if (created) {
      console.log(`\n🎉 SUCCESS! Admin user created successfully.`);
    } else {
      // If user already exists, update their password and role to ensure they can log in
      adminUser.password = hashedPassword;
      adminUser.role = "admin";
      adminUser.active = true;
      adminUser.phone = phone;
      await adminUser.save();
      console.log(`\n🎉 SUCCESS! Existing user '${username}' has been updated to Admin with your new password.`);
    }

    console.log("----------------------------------------------------");
    console.log(`Username:  ${username}`);
    console.log(`Password:  ${password}`);
    console.log(`Role:      admin`);
    console.log("----------------------------------------------------");
    console.log("\n🔑 You can now log into your Flutter Desktop app using these credentials!");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
  } finally {
    await sequelize.close();
    rl.close();
  }
}

function printCentered(text) {
  const width = 52;
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  console.log(" ".repeat(padding) + text);
}

main();
