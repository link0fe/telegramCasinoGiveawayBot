import {
    db,
} from "../database/db.js";

import {
    sql,
} from "drizzle-orm";


const result =
    await db.all(
        sql`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
        `,
    );


console.table(
    result,
);