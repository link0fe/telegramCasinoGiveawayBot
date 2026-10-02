import {
    and,
    asc,
    eq,
    notInArray,
    sql,
} from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    vouchers,
} from "../../database/schema.js";


export class VoucherRepository {

    async findAvailable(
        amount: number,
        currency: string,
        excludeIds: number[] = [],
    ) {

        const conditions = [
            eq(
                vouchers.amount,
                amount,
            ),
            eq(
                vouchers.currency,
                currency,
            ),
            eq(
                vouchers.isUsed,
                false,
            ),
        ];


        if (
            excludeIds.length >
            0
        ) {
            conditions.push(
                notInArray(
                    vouchers.id,
                    excludeIds,
                ),
            );
        }


        const result =
            await db
                .select()
                .from(vouchers)
                .where(
                    and(
                        ...conditions,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    async findByCode(
        code: string,
    ) {

        const result =
            await db
                .select()
                .from(vouchers)
                .where(
                    eq(
                        vouchers.code,
                        code,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    async create(
        code: string,
        amount: number,
        currency: string,
    ) {

        const result =
            await db
                .insert(vouchers)
                .values({
                    code,
                    amount,
                    currency,
                    isUsed: false,
                })
                .onConflictDoNothing({
                    target:
                        vouchers.code,
                })
                .returning();


        return result[0] ?? null;
    }


    async findAll() {

        return await db
            .select()
            .from(vouchers);
    }


    async getStatistics() {

        const totals =
            await db
                .select({
                    total:
                        sql<number>`
                            count(*)
                        `,

                    available:
                        sql<number>`
                            sum(
                                case
                                    when ${vouchers.isUsed} = 0
                                    then 1
                                    else 0
                                end
                            )
                        `,

                    used:
                        sql<number>`
                            sum(
                                case
                                    when ${vouchers.isUsed} = 1
                                    then 1
                                    else 0
                                end
                            )
                        `,
                })
                .from(vouchers);


        const denominations =
            await db
                .select({
                    amount:
                        vouchers.amount,

                    currency:
                        vouchers.currency,

                    total:
                        sql<number>`
                            count(*)
                        `,

                    available:
                        sql<number>`
                            sum(
                                case
                                    when ${vouchers.isUsed} = 0
                                    then 1
                                    else 0
                                end
                            )
                        `,
                })
                .from(vouchers)
                .groupBy(
                    vouchers.amount,
                    vouchers.currency,
                )
                .orderBy(
                    asc(
                        vouchers.amount,
                    ),
                );


        return {
            total:
                Number(
                    totals[0]?.total ??
                    0,
                ),

            available:
                Number(
                    totals[0]?.available ??
                    0,
                ),

            used:
                Number(
                    totals[0]?.used ??
                    0,
                ),

            denominations:
                denominations.map(
                    (item) => ({
                        amount:
                            item.amount,

                        currency:
                            item.currency,

                        total:
                            Number(
                                item.total ??
                                0,
                            ),

                        available:
                            Number(
                                item.available ??
                                0,
                            ),
                    }),
                ),
        };
    }


    async markUsed(
        voucherId: number,
        winnerId: number,
    ) {

        const result =
            await db
                .update(vouchers)
                .set({
                    isUsed:
                        true,

                    winnerId,

                    usedAt:
                        new Date(),
                })
                .where(
                    and(
                        eq(
                            vouchers.id,
                            voucherId,
                        ),

                        eq(
                            vouchers.isUsed,
                            false,
                        ),
                    ),
                )
                .returning();


        return result[0] ?? null;
    }
}