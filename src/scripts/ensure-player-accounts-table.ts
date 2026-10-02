import {
    sql,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";


console.log(
    "Checking player_accounts table...",
);


await db.run(
    sql`
        CREATE TABLE IF NOT EXISTS player_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,

            user_id INTEGER NOT NULL,

            casino_player_id INTEGER NOT NULL,

            created_at INTEGER NOT NULL,

            FOREIGN KEY (user_id)
                REFERENCES users(id),

            FOREIGN KEY (casino_player_id)
                REFERENCES casino_players(id)
        )
    `,
);


await db.run(
    sql`
        CREATE UNIQUE INDEX IF NOT EXISTS
            player_accounts_user_id_unique
        ON player_accounts (user_id)
    `,
);


await db.run(
    sql`
        CREATE UNIQUE INDEX IF NOT EXISTS
            player_accounts_casino_player_id_unique
        ON player_accounts (casino_player_id)
    `,
);


console.log(
    "✅ player_accounts table exists.",
);


const tables =
    await db.all(
        sql`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
        `,
    );


console.log(
    "\nTables:",
);

console.table(
    tables,
);