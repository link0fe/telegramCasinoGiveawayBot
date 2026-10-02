import {
    eq,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    vouchers,
} from "../database/schema.js";


async function main() {

    console.log(
        "\n=== RESET USED VOUCHERS ===\n",
    );


    const usedVouchers =
        await db
            .select()
            .from(vouchers)
            .where(
                eq(
                    vouchers.isUsed,
                    true,
                ),
            );


    if (
        usedVouchers.length ===
        0
    ) {
        console.log(
            "Used vouchers not found.",
        );

        return;
    }


    console.log(
        `Found used vouchers: ${usedVouchers.length}`,
    );

    console.table(
        usedVouchers.map(
            (voucher) => ({
                id:
                    voucher.id,

                code:
                    voucher.code,

                amount:
                    voucher.amount,

                currency:
                    voucher.currency,

                winnerId:
                    voucher.winnerId,
            }),
        ),
    );


    await db
        .update(vouchers)
        .set({
            isUsed:
                false,

            winnerId:
                null,

            usedAt:
                null,
        })
        .where(
            eq(
                vouchers.isUsed,
                true,
            ),
        );


    console.log(
        "\n✅ All used vouchers are available again.\n",
    );


    const vouchersAfterReset =
        await db
            .select()
            .from(vouchers);


    console.table(
        vouchersAfterReset.map(
            (voucher) => ({
                id:
                    voucher.id,

                code:
                    voucher.code,

                amount:
                    voucher.amount,

                currency:
                    voucher.currency,

                isUsed:
                    voucher.isUsed,

                winnerId:
                    voucher.winnerId,

                usedAt:
                    voucher.usedAt,
            }),
        ),
    );
}


main()
    .then(
        () => {
            process.exit(
                0,
            );
        },
    )
    .catch(
        (error) => {

            console.error(
                "\n❌ Failed to reset vouchers:",
                error,
            );

            process.exit(
                1,
            );
        },
    );