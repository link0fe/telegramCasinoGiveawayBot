import type {
    CasinoPlayer,
} from "./casino.types.js";


export interface CasinoDataProvider {
    findPlayerById(
        playerId: string,
    ): Promise<CasinoPlayer | null>;
}