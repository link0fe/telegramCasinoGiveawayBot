import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.js";

const dataDir = path.resolve("./data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true,
    });
}

const sqlite = new Database(
    path.join(dataDir, "database.db")
);

sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, {
    schema,
});