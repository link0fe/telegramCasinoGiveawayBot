import { eq } from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    casinoPlayers,
} from "../../database/schema.js";

import type {
    CasinoPlayer,
} from "./casino.types.js";

import type {
    CasinoDataProvider,
} from "./casino-data.provider.js";


export class DatabaseCasinoDataProvider
    implements CasinoDataProvider {

    async findPlayerById(
        playerId: string,
    ): Promise<CasinoPlayer | null> {

        const result =
            await db
                .select()
                .from(casinoPlayers)
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
            return null;
        }


        return {
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
        };
    }
}