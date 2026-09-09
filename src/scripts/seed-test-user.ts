import { eq } from "drizzle-orm";

import { db } from "../database/db.js";
import { users } from "../database/schema.js";

const telegramId = "999999999";

const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

if (existing.length > 0) {
    console.log("Test user already exists:");
    console.log(existing[0]);
    process.exit(0);
}

const result = await db
    .insert(users)
    .values({
        telegramId,
        username: "test_partner",
        firstName: "Test Partner",
        role: "PLAYER",
    })
    .returning();

console.log("Test user created:");
console.log(result[0]);