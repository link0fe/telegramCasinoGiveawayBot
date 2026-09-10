import { eq } from "drizzle-orm";

import { db } from "../database/db.js";

import {
    giveaways,
} from "../database/schema.js";


const giveawayId =
    Number(process.argv[2]);


if (
    !Number.isInteger(giveawayId) ||
    giveawayId < 1
) {
    console.error(
        "Usage: npm.cmd run giveaway:expire -- <giveawayId>",
    );

    process.exit(1);
}


const newEndDate =
    new Date(
        Date.now() - 60_000,
    );


const result =
    await db
        .update(giveaways)
        .set({
            endsAt: newEndDate,
            updatedAt: new Date(),
        })
        .where(
            eq(
                giveaways.id,
                giveawayId,
            ),
        )
        .returning();


if (result.length === 0) {
    console.log(
        "Giveaway not found.",
    );

    process.exit(0);
}


console.log(
    `Giveaway ${giveawayId} expired.`,
);

console.log(
    "New endsAt:",
    result[0]?.endsAt,
);