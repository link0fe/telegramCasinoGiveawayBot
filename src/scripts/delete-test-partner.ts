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


const TEST_TELEGRAM_ID =
    "TEST_PARTNER_B";

const TEST_AFFILIATE_ID =
    "TEST_AFFILIATE_B";


console.log(
    "\n=== DELETE TEST PARTNER B ===\n",
);


/*
 * =====================================
 * FIND TEST USER
 * =====================================
 */

const userResult =
    await db
        .select()
        .from(
            users,
        )
        .where(
            eq(
                users.telegramId,
                TEST_TELEGRAM_ID,
            ),
        )
        .limit(1);


const testUser =
    userResult[0];


if (!testUser) {
    console.log(
        "ℹ️ Test user not found.",
    );

    process.exit(0);
}


/*
 * =====================================
 * FIND TEST PARTNER
 * =====================================
 */

const partnerResult =
    await db
        .select()
        .from(
            partners,
        )
        .where(
            eq(
                partners.userId,
                testUser.id,
            ),
        )
        .limit(1);


const testPartner =
    partnerResult[0];


if (testPartner) {

    /*
     * Дополнительная защита.
     *
     * Не удаляем partner,
     * если affiliateId неожиданно
     * оказался другим.
     */
    if (
        testPartner.affiliateId !==
        TEST_AFFILIATE_ID
    ) {
        console.error(
            "❌ Partner affiliateId does not match test affiliate.",
        );

        console.error(
            "Deletion cancelled.",
        );

        console.table([
            {
                partnerId:
                    testPartner.id,

                name:
                    testPartner.name,

                affiliateId:
                    testPartner.affiliateId,

                userId:
                    testPartner.userId,
            },
        ]);

        process.exit(1);
    }


    await db
        .delete(
            partners,
        )
        .where(
            eq(
                partners.id,
                testPartner.id,
            ),
        );


    console.log(
        `✅ Test partner ${testPartner.id} deleted.`,
    );
} else {
    console.log(
        "ℹ️ Test partner not found.",
    );
}


/*
 * =====================================
 * DELETE TEST USER
 * =====================================
 */

await db
    .delete(
        users,
    )
    .where(
        eq(
            users.id,
            testUser.id,
        ),
    );


console.log(
    `✅ Test user ${testUser.id} deleted.`,
);


console.log(
    "\n=== CLEANUP COMPLETE ===\n",
);