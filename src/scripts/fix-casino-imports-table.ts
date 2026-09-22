import Database from "better-sqlite3";
import path from "node:path";

const databasePath =
    path.resolve(
        "./data/database.db",
    );

const sqlite =
    new Database(databasePath);

try {
    const table =
        sqlite
            .prepare(`
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name = 'casino_imports'
            `)
            .get();

    if (table) {
        console.log(
            "✓ casino_imports already exists",
        );
    } else {
        console.log(
            "Creating casino_imports...",
        );

        sqlite.exec(`
            CREATE TABLE casino_imports (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                source TEXT NOT NULL,
                file_name TEXT,
                total_rows INTEGER DEFAULT 0 NOT NULL,
                imported_rows INTEGER DEFAULT 0 NOT NULL,
                skipped_rows INTEGER DEFAULT 0 NOT NULL,
                status TEXT NOT NULL,
                uploaded_by_user_id INTEGER,
                error_message TEXT,
                started_at INTEGER NOT NULL,
                finished_at INTEGER,
                FOREIGN KEY (uploaded_by_user_id)
                    REFERENCES users(id)
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
            );
        `);

        console.log(
            "✅ casino_imports created",
        );
    }
} finally {
    sqlite.close();
}