import {
    asc,
    eq,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    casinoPlayers,
} from "../database/schema.js";


async function main() {

    /*
     * Affiliate нашего
     * тестового партнёра Dan.
     */
    const affiliateId =
        "86375";


    const players =
        await db
            .select({
                id:
                    casinoPlayers.id,

                playerId:
                    casinoPlayers.playerId,

                affiliateId:
                    casinoPlayers.affiliateId,

                affiliateName:
                    casinoPlayers.affiliateName,

                firstDepositCount:
                    casinoPlayers.firstDepositCount,

                firstDepositAmount:
                    casinoPlayers.firstDepositAmount,
            })
            .from(
                casinoPlayers,
            )
            .where(
                eq(
                    casinoPlayers.affiliateId,
                    affiliateId,
                ),
            )
            .orderBy(
                asc(
                    casinoPlayers.id,
                ),
            )
            .limit(
                10,
            );


    console.log(
        `\n=== PLAYERS FOR AFFILIATE ${affiliateId} ===\n`,
    );


    if (
        players.length ===
        0
    ) {

        console.log(
            "Players not found.",
        );

        return;
    }


    console.table(
        players,
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
                error,
            );

            process.exit(
                1,
            );
        },
    );