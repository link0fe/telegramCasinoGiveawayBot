import {
    eq,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    partners,
    users,
} from "../database/schema.js";


const result =
    await db
        .select({
            partnerId:
                partners.id,

            name:
                partners.name,

            affiliateId:
                partners.affiliateId,

            isActive:
                partners.isActive,

            userId:
                users.id,

            telegramId:
                users.telegramId,

            username:
                users.username,

            role:
                users.role,
        })
        .from(
            partners,
        )
        .innerJoin(
            users,
            eq(
                partners.userId,
                users.id,
            ),
        );


console.log(
    "\n=== PARTNERS ===\n",
);

console.table(
    result,
);