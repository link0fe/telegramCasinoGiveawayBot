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

const TEST_PARTNER_NAME =
    "Test Partner B";


console.log(
    "\n=== CREATE TEST PARTNER B ===\n",
);


/*
 * Ищем тестового user.
 */
let testUser =
    (
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
            .limit(1)
    )[0];


if (!testUser) {

    const createdUsers =
        await db
            .insert(
                users,
            )
            .values({
                telegramId:
                    TEST_TELEGRAM_ID,

                username:
                    "test_partner_b",

                firstName:
                    "Test Partner B",

                role:
                    "PARTNER",
            })
            .returning();


    testUser =
        createdUsers[0];


    if (!testUser) {
        throw new Error(
            "TEST_USER_CREATE_FAILED",
        );
    }


    console.log(
        "✅ Test user created.",
    );
} else {

    /*
     * На всякий случай возвращаем
     * правильную роль.
     */
    await db
        .update(
            users,
        )
        .set({
            role:
                "PARTNER",

            updatedAt:
                new Date(),
        })
        .where(
            eq(
                users.id,
                testUser.id,
            ),
        );


    console.log(
        "ℹ️ Test user already exists.",
    );
}


/*
 * Ищем partner по userId.
 */
let testPartner =
    (
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
            .limit(1)
    )[0];


if (!testPartner) {

    const createdPartners =
        await db
            .insert(
                partners,
            )
            .values({
                userId:
                    testUser.id,

                name:
                    TEST_PARTNER_NAME,

                affiliateId:
                    TEST_AFFILIATE_ID,

                isActive:
                    true,
            })
            .returning();


    testPartner =
        createdPartners[0];


    if (!testPartner) {
        throw new Error(
            "TEST_PARTNER_CREATE_FAILED",
        );
    }


    console.log(
        "✅ Test Partner B created.",
    );
} else {

    await db
        .update(
            partners,
        )
        .set({
            name:
                TEST_PARTNER_NAME,

            affiliateId:
                TEST_AFFILIATE_ID,

            isActive:
                true,

            updatedAt:
                new Date(),
        })
        .where(
            eq(
                partners.id,
                testPartner.id,
            ),
        );


    console.log(
        "ℹ️ Test Partner B already exists.",
    );
}


/*
 * Показываем результат.
 */
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
        )
        .where(
            eq(
                partners.userId,
                testUser.id,
            ),
        );


console.log(
    "\n=== TEST PARTNER ===\n",
);

console.table(
    result,
);