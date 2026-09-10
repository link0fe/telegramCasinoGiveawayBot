import type { CasinoPlayer } from "./casino.types";
import type {
    CasinoDataProvider,
} from "./casino-data.provider.js";

const players: CasinoPlayer[] = [
    {
        playerId: "100001",
        affiliateId: "77777",
        affiliateName: "My Test Partner",
        firstDepositCount: 1,
        firstDepositAmount: 50,
    },
    {
        playerId: "100002",
        affiliateId: "77777",
        affiliateName: "My Test Partner",
        firstDepositCount: 0,
        firstDepositAmount: 0,
    },
    {
        playerId: "200001",
        affiliateId: "99123",
        affiliateName: "Alex",
        firstDepositCount: 1,
        firstDepositAmount: 100,
    },
];

export class FakeCasinoDataProvider implements CasinoDataProvider {
    async findPlayerById(playerId: string): Promise<CasinoPlayer | null> {
        return (
            players.find((player) => player.playerId === playerId ) ?? null
        );
    }
}