import Database from "./src/models/services/Database.ts";
import User from "./src/models/User.ts";
import dotenv from "dotenv";

dotenv.config();

async function checkUsers() {
    await Database.init();
    const users = await User.model.find({}).populate('roles');
    console.log("Users in DB:", JSON.stringify(users, null, 2));
    process.exit(0);
}

checkUsers();
