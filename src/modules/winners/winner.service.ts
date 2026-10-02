import {
    randomInt,
} from "node:crypto";

import {
    WinnerRepository,
} from "./winner.repository.js";


export class WinnerService {

    constructor(
        private readonly winnerRepository =
            new WinnerRepository(),
    ) {}


    /*
     * =====================================
     * SECURE SHUFFLE
     * =====================================
     */
    private shuffle<T>(
        input: T[],
    ): T[] {

        const result =
            [...input];


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


    /*
     * =====================================
     * FINISH GIVEAWAY
     * =====================================
     */
    async finishGiveaway(
        giveawayId: number,
    ) {

        /*
         * Получаем giveaway.
         */
        const giveaway =
            await this.winnerRepository
                .findGiveaway(
                    giveawayId,
                );


        if (!giveaway) {

            return {
                success:
                    false as const,

                reason:
                    "GIVEAWAY_NOT_FOUND" as const,
            };
        }


        /*
         * Розыгрыш уже завершён.
         */
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
                success:
                    false as const,

                reason:
                    "GIVEAWAY_ALREADY_FINISHED" as const,

                winners:
                    existingWinners,
            };
        }


        /*
         * Можно завершать только
         * ACTIVE giveaway.
         */
        if (
            giveaway.status !==
            "ACTIVE"
        ) {

            return {
                success:
                    false as const,

                reason:
                    "GIVEAWAY_NOT_ACTIVE" as const,
            };
        }


        /*
         * Нельзя завершить раньше времени.
         */
        if (
            giveaway.endsAt.getTime() >
            Date.now()
        ) {

            return {
                success:
                    false as const,

                reason:
                    "GIVEAWAY_NOT_ENDED_YET" as const,
            };
        }


        /*
         * Получаем участников.
         */
        const participants =
            await this.winnerRepository
                .findParticipants(
                    giveawayId,
                );


        /*
         * Если участников меньше,
         * чем winnersCount —
         * победителей будет столько,
         * сколько реально участников.
         *
         * Например:
         *
         * winnersCount = 5
         * participants = 3
         *
         * => 3 победителя.
         */
        const actualWinnersCount =
            Math.min(
                participants.length,
                giveaway.winnersCount,
            );


        /*
         * Если участников вообще нет,
         * завершаем giveaway без winners.
         */
        if (
            actualWinnersCount === 0
        ) {

            await this.winnerRepository
                .saveWinnersAndFinish(
                    giveawayId,
                    [],
                );


            return {
                success:
                    true as const,

                winners: [],
            };
        }


        /*
         * Проверяем наличие нужного
         * количества ваучеров.
         *
         * Например:
         *
         * prizeAmount = 1000
         * winners = 3
         *
         * => нужны 3 свободных
         * voucher по 1000 RUB.
         */
        const availableVouchers =
            await this.winnerRepository
                .findAvailableVouchers(
                    giveaway.prizeAmount,
                    giveaway.currency,
                    actualWinnersCount,
                );


        /*
         * Не завершаем giveaway,
         * если ваучеров недостаточно.
         *
         * Это важно:
         * сначала проверяем ВСЕ ваучеры,
         * и только потом выбираем winners.
         */
        if (
            availableVouchers.length <
            actualWinnersCount
        ) {

            return {
                success:
                    false as const,

                reason:
                    "NOT_ENOUGH_VOUCHERS" as const,

                required:
                    actualWinnersCount,

                available:
                    availableVouchers.length,

                prizeAmount:
                    giveaway.prizeAmount,

                currency:
                    giveaway.currency,
            };
        }


        /*
         * Перемешиваем участников.
         */
        const shuffled =
            this.shuffle(
                participants,
            );


        /*
         * Берём нужное количество.
         */
        const selected =
            shuffled.slice(
                0,
                actualWinnersCount,
            );


        /*
         * Подготавливаем данные.
         *
         * place оставляем технически
         * для существующей таблицы winners.
         *
         * Но в UI больше не считаем
         * 1, 2, 3 разными призовыми местами.
         *
         * Все получают одинаковый номинал.
         */
        const winnerData =
            selected.map(
                (
                    participant,
                    index,
                ) => {

                    const voucher =
                        availableVouchers[
                            index
                        ]!;


                    return {
                        participantId:
                            participant.id,

                        telegramUserId:
                            participant.telegramUserId,

                        casinoPlayerId:
                            participant.casinoPlayerId,

                        place:
                            index + 1,

                        prizeAmount:
                            giveaway.prizeAmount,

                        currency:
                            giveaway.currency,

                        voucherId:
                            voucher.id,

                        voucherCode:
                            voucher.code,
                    };
                },
            );


        /*
         * Сохраняем winners,
         * используем vouchers
         * и завершаем giveaway
         * одной transaction.
         */
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


        /*
         * Эти данные затем используются
         * для отправки сообщений
         * победителям.
         */
        return {
            success:
                true as const,

            winners:
                winnerData,
        };
    }
}