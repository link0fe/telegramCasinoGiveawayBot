import { db } from "../database/db.js";
import { users } from "../database/schema.js";

const result = await db
    .select()
    .from(users);

console.log(result);