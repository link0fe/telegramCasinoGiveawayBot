import Database from "better-sqlite3";

const db =
    new Database(
        "./data/database.db",
    );

const columns =
    db
        .prepare(
            "PRAGMA table_info(casino_players)",
        )
        .all() as {
            name: string;
        }[];

const names =
    new Set(
        columns.map(
            (column) => column.name,
        ),
    );

if (!names.has("registration_date")) {
    db.exec(`
        ALTER TABLE casino_players
        ADD COLUMN registration_date TEXT
    `);

    console.log(
        "✅ Added registration_date",
    );
}

if (!names.has("first_deposit_date")) {
    db.exec(`
        ALTER TABLE casino_players
        ADD COLUMN first_deposit_date TEXT
    `);

    console.log(
        "✅ Added first_deposit_date",
    );
}

console.log(
    "✅ casino_players schema fixed",
);

db.close();