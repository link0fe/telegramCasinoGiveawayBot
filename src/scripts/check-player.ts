import {
    eq,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    casinoPlayers,
} from "../database/schema.js";


const playerId =
    process.argv[2];


if (!playerId) {
    console.error(
        "Usage: npx.cmd tsx src/scripts/check-player.ts <playerId>",
    );

    process.exit(1);
}


const result =
    await db
        .select()
        .from(
            casinoPlayers,
        )
        .where(
            eq(
                casinoPlayers.playerId,
                playerId,
            ),
        )
        .limit(1);


const player =
    result[0];


if (!player) {
    console.log(
        `Player ${playerId} not found.`,
    );

    process.exit(0);
}


console.log(
    "\n=== CASINO PLAYER ===\n",
);

console.table([
    {
        id:
            player.id,

        playerId:
            player.playerId,

        affiliateId:
            player.affiliateId,

        affiliateName:
            player.affiliateName,

        firstDepositCount:
            player.firstDepositCount,

        firstDepositAmount:
            player.firstDepositAmount,
    },
]);