import { eq } from "drizzle-orm";

import { db } from "../database/db.js";
import { users } from "../database/schema.js";

const telegramId = "2023169233";

const result = await db
    .update(users)
    .set({
        role: "ADMIN",
        updatedAt: new Date(),
    })
    .where(
        eq(users.telegramId, telegramId),
    )
    .returning();

console.log("Updated user:", result[0]);