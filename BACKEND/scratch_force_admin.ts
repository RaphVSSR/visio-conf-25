import Database from "./src/models/services/Database.ts";
import User from "./src/models/User.ts";
import Role from "./src/models/Role.ts";
import dotenv from "dotenv";

dotenv.config();

async function forceAdmin() {
    await Database.init();
    const adminRole = await Role.model.findOne({ uuid: "admin" });
    if (!adminRole) {
        console.error("Admin role not found!");
        process.exit(1);
    }

    const emails = ["dev@visioconf.com", "test1@visioconf.com"];
    for (const email of emails) {
        const user = await User.model.findOne({ email });
        if (user) {
            user.roles = [adminRole._id];
            await user.save();
            console.log(`User ${email} is now ADMIN`);
        } else {
            console.log(`User ${email} not found`);
        }
    }
    process.exit(0);
}

forceAdmin();
