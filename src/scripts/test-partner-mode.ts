import {
    eq,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    users,
    partners,
} from "../database/schema.js";

const USER_ID = 1;

const partner =
    await db
        .select()
        .from(partners)
        .where(
            eq(
                partners.userId,
                USER_ID,
            ),
        )
        .limit(1);

if (!partner[0]) {
    console.log(
        "❌ Для userId=1 нет записи в partners",
    );

    process.exit(1);
}

await db
    .update(partners)
    .set({
        isActive: true,
        updatedAt: new Date(),
    })
    .where(
        eq(
            partners.userId,
            USER_ID,
        ),
    );

await db
    .update(users)
    .set({
        role: "PARTNER",
        updatedAt: new Date(),
    })
    .where(
        eq(
            users.id,
            USER_ID,
        ),
    );

console.log(
    `✅ User #${USER_ID} переключён в PARTNER`,
);

console.log(
    `Partner: ${partner[0].name}`,
);

console.log(
    `Affiliate ID: ${partner[0].affiliateId}`,
);