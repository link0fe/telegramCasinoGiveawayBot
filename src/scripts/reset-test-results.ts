import {
    db,
} from "../database/db.js";

import {
    vouchers,
    winners,
} from "../database/schema.js";


async function main() {

    console.log(
        "\n=== RESET TEST RESULTS ===\n",
    );


    /*
     * Сначала освобождаем ваучеры.
     *
     * Это важно сделать ДО удаления winners,
     * потому что vouchers.winnerId ссылается
     * на winners.id.
     */
    await db
        .update(vouchers)
        .set({
            isUsed:
                false,

            winnerId:
                null,

            usedAt:
                null,
        });


    /*
     * Теперь удаляем старую историю
     * победителей.
     */
    await db
        .delete(winners);


    console.log(
        "✅ Vouchers released.",
    );

    console.log(
        "✅ Old winners deleted.",
    );


    const allVouchers =
        await db
            .select()
            .from(vouchers);


    console.log(
        "\n=== VOUCHERS ===\n",
    );

    console.table(
        allVouchers.map(
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
            process.exit(0);
        },
    )
    .catch(
        (error) => {

            console.error(
                "\n❌ Reset failed:",
                error,
            );

            process.exit(1);
        },
    );