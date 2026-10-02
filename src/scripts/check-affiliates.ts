import {
    sql,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    casinoPlayers,
} from "../database/schema.js";


const affiliates =
    await db
        .select({
            affiliateId:
                casinoPlayers.affiliateId,

            affiliateName:
                casinoPlayers.affiliateName,

            players:
                sql<number>`
                    count(*)
                `,
        })
        .from(
            casinoPlayers,
        )
        .groupBy(
            casinoPlayers.affiliateId,
            casinoPlayers.affiliateName,
        );


console.log(
    "\n=== AFFILIATES ===\n",
);

console.table(
    affiliates,
);