import Database from "./src/models/services/Database.ts";
import Role from "./src/models/Role.ts";
import dotenv from "dotenv";

dotenv.config();

async function checkRoles() {
    await Database.init();
    const roles = await Role.model.find({});
    console.log("Roles in DB:", JSON.stringify(roles, null, 2));
    process.exit(0);
}

checkRoles();
