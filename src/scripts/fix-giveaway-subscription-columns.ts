import Database from "better-sqlite3";
import path from "node:path";

const databasePath =
    path.resolve(
        "./data/database.db",
    );

const sqlite =
    new Database(databasePath);

try {
    const columns =
        sqlite
            .prepare(
                "PRAGMA table_info(giveaways)",
            )
            .all() as {
                name: string;
            }[];

    const columnNames =
        new Set(
            columns.map(
                (column) =>
                    column.name,
            ),
        );

    if (
        !columnNames.has(
            "require_channel_subscription",
        )
    ) {
        console.log(
            "Adding require_channel_subscription...",
        );

        sqlite.exec(`
            ALTER TABLE giveaways
            ADD COLUMN require_channel_subscription
            INTEGER NOT NULL DEFAULT 0
        `);

        console.log(
            "✅ require_channel_subscription added",
        );
    } else {
        console.log(
            "✓ require_channel_subscription already exists",
        );
    }

    if (
        !columnNames.has(
            "channel_username",
        )
    ) {
        console.log(
            "Adding channel_username...",
        );

        sqlite.exec(`
            ALTER TABLE giveaways
            ADD COLUMN channel_username TEXT
        `);

        console.log(
            "✅ channel_username added",
        );
    } else {
        console.log(
            "✓ channel_username already exists",
        );
    }

    console.log(
        "✅ Giveaway subscription columns fixed",
    );
} finally {
    sqlite.close();
}