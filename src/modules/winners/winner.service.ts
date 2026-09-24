import {
    randomInt,
} from "node:crypto";

import {
    WinnerRepository,
} from "./winner.repository.js";

import {
    VoucherRepository,
} from "../vouchers/voucher.repository.js";


export class WinnerService {

    constructor(
        private readonly winnerRepository =
            new WinnerRepository(),

        private readonly voucherRepository =
            new VoucherRepository(),
    ) {}


    private shuffle<T>(
        input: T[],
    ): T[] {
        const result = [...input];

        for (
            let i =
                result.length - 1;
            i > 0;
            i--
        ) {
            const j =
                randomInt(
                    0,
                    i + 1,
                );

            [
                result[i],
                result[j],
            ] = [
                result[j]!,
                result[i]!,
            ];
        }

        return result;
    }


    async finishGiveaway(
        giveawayId: number,
    ) {
        const giveaway =
            await this.winnerRepository
                .findGiveaway(
                    giveawayId,
                );


        if (!giveaway) {
            return {
                success: false as const,
                reason:
                    "GIVEAWAY_NOT_FOUND" as const,
            };
        }


        if (
            giveaway.status ===
            "FINISHED"
        ) {
            const existingWinners =
                await this.winnerRepository
                    .findWinners(
                        giveawayId,
                    );

            return {
                success: false as const,
                reason:
                    "GIVEAWAY_ALREADY_FINISHED" as const,
                winners:
                    existingWinners,
            };
        }


        if (
            giveaway.status !==
            "ACTIVE"
        ) {
            return {
                success: false as const,
                reason:
                    "GIVEAWAY_NOT_ACTIVE" as const,
            };
        }


        if (
            giveaway.endsAt.getTime() >
            Date.now()
        ) {
            return {
                success: false as const,
                reason:
                    "GIVEAWAY_NOT_ENDED_YET" as const,
            };
        }


        const participants =
            await this.winnerRepository
                .findParticipants(
                    giveawayId,
                );


        const actualWinnersCount =
            Math.min(
                participants.length,
                giveaway.winnersCount,
            );


        const prizes =
            await this.winnerRepository
                .findPrizes(
                    giveawayId,
                );


        if (
            prizes.length <
            actualWinnersCount
        ) {
            return {
                success: false as const,
                reason:
                    "NOT_ENOUGH_PRIZES" as const,
            };
        }


        const shuffled =
            this.shuffle(
                participants,
            );


        const selected =
            shuffled.slice(
                0,
                actualWinnersCount,
            );


        const reservedVoucherIds =
            new Set<number>();


        const winnerData: {
            participantId: number;
            telegramUserId: string;
            casinoPlayerId: string;
            place: number;
            prizeAmount: number;
            currency: string;
            voucherId: number;
            voucherCode: string;
        }[] = [];


        for (
            let index = 0;
            index < selected.length;
            index++
        ) {
            const participant =
                selected[index]!;


            const place =
                index + 1;


            const prize =
                prizes.find(
                    (item) =>
                        item.place ===
                        place,
                );


            if (!prize) {
                throw new Error(
                    `Prize for place ${place} not found.`,
                );
            }


            const availableVouchers =
                await this.voucherRepository
                    .findAll();


            const voucher =
                availableVouchers.find(
                    (item) =>
                        !item.isUsed &&
                        item.amount ===
                            prize.amount &&
                        item.currency ===
                            prize.currency &&
                        !reservedVoucherIds.has(
                            item.id,
                        ),
                );


            if (!voucher) {
                return {
                    success: false as const,
                    reason:
                        "NO_AVAILABLE_VOUCHER" as const,
                    place,
                    prizeAmount:
                        prize.amount,
                    currency:
                        prize.currency,
                };
            }


            reservedVoucherIds.add(
                voucher.id,
            );


            winnerData.push({
                participantId:
                    participant.id,

                telegramUserId:
                    participant.telegramUserId,

                casinoPlayerId:
                    participant.casinoPlayerId,

                place,

                prizeAmount:
                    prize.amount,

                currency:
                    prize.currency,

                voucherId:
                    voucher.id,

                voucherCode:
                    voucher.code,
            });
        }


        await this.winnerRepository
            .saveWinnersAndFinish(
                giveawayId,

                winnerData.map(
                    (winner) => ({
                        participantId:
                            winner.participantId,

                        place:
                            winner.place,

                        prizeAmount:
                            winner.prizeAmount,

                        currency:
                            winner.currency,

                        voucherId:
                            winner.voucherId,

                        voucherCode:
                            winner.voucherCode,
                    }),
                ),
            );


        return {
            success: true as const,
            winners:
                winnerData,
        };
    }
}