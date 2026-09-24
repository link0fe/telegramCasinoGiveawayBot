import Database from "better-sqlite3";
import path from "node:path";

const databasePath =
    path.resolve(
        "./data/database.db",
    );

const sqlite =
    new Database(
        databasePath,
    );

const table =
    sqlite
        .prepare(
            `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name = 'vouchers'
            `,
        )
        .get();

if (table) {
    console.log(
        "✅ vouchers table already exists.",
    );

    sqlite.close();
    process.exit(0);
}

sqlite.exec(`
    CREATE TABLE vouchers (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        is_used INTEGER NOT NULL DEFAULT 0,
        winner_id INTEGER,
        used_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (winner_id)
            REFERENCES winners(id)
            ON UPDATE NO ACTION
            ON DELETE NO ACTION
    );
`);

console.log(
    "✅ vouchers table created.",
);

sqlite.close();