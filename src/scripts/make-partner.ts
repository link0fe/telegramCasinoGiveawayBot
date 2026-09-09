import { eq } from "drizzle-orm";

import { db } from "../database/db.js";
import {
    users,
    partners,
} from "../database/schema.js";

const telegramId =
    "5441490810";
// zamenitj
const [user] = await db
    .select()
    .from(users)
    .where(
        eq(
            users.telegramId,
            telegramId,
        ),
    )
    .limit(1);

if (!user) {
    throw new Error(
        "User not found",
    );
}


await db
    .update(users)
    .set({
        role: "PARTNER",
        updatedAt: new Date(),
    })
    .where(
        eq(users.id, user.id),
    );


const [existingPartner] =
    await db
        .select()
        .from(partners)
        .where(
            eq(
                partners.userId,
                user.id,
            ),
        )
        .limit(1);


if (!existingPartner) {
    await db
        .insert(partners)
        .values({
            userId: user.id,
            name: "My Test Partner",
            affiliateId: "77777",
        });
}


console.log(
    "User is now PARTNER",
);