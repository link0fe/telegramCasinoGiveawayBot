import {
    ParticipantRepository,
} from "./participant.repository.js";

import {
    EligibilityService,
} from "../eligibility/eligibility.service.js";

import {
    PlayerAccountService,
} from "../player-accounts/player-account.service.js";


export class ParticipantService {

    constructor(
        private readonly participantRepository =
            new ParticipantRepository(),

        private readonly eligibilityService =
            new EligibilityService(),

        private readonly playerAccountService =
            new PlayerAccountService(),
    ) {}


    async joinGiveaway(
        giveawayId: number,
        telegramUserId: string,
        casinoPlayerId?: string,
    ) {

        /*
         * Сначала проверяем:
         * Telegram user уже участвует
         * в этом giveaway?
         */
        const existingTelegram =
            await this.participantRepository
                .findByTelegramUser(
                    giveawayId,
                    telegramUserId,
                );


        if (existingTelegram) {
            return {
                success:
                    false as const,

                reason:
                    "ALREADY_JOINED" as const,
            };
        }


        /*
         * Проверяем постоянную привязку
         * Telegram -> Casino Player.
         */
        const linkedPlayer =
            await this.playerAccountService
                .getLinkedPlayer(
                    telegramUserId,
                );


        /*
         * Определяем Player ID,
         * который будем использовать.
         *
         * Если аккаунт уже привязан —
         * введённый вручную ID игнорируем.
         */
        let resolvedPlayerId:
            string;


        if (linkedPlayer) {
            resolvedPlayerId =
                linkedPlayer.playerId;
        } else {

            /*
             * Если привязки ещё нет,
             * Player ID должен прийти
             * от пользователя.
             */
            if (!casinoPlayerId) {
                return {
                    success:
                        false as const,

                    reason:
                        "PLAYER_ID_REQUIRED" as const,
                };
            }


            resolvedPlayerId =
                casinoPlayerId;
        }


        /*
         * Проверяем, не используется ли
         * этот Casino Player другим
         * участником этого giveaway.
         */
        const existingPlayer =
            await this.participantRepository
                .findByCasinoPlayer(
                    giveawayId,
                    resolvedPlayerId,
                );


        if (existingPlayer) {
            return {
                success:
                    false as const,

                reason:
                    "PLAYER_ID_ALREADY_USED" as const,
            };
        }


        /*
         * Проверяем eligibility:
         *
         * - player существует;
         * - affiliate правильный;
         * - FTD;
         * - сумма FTD;
         * - остальные условия giveaway.
         */
        const eligibility =
            await this.eligibilityService
                .check(
                    giveawayId,
                    resolvedPlayerId,
                );


        if (!eligibility.eligible) {
            return {
                success:
                    false as const,

                reason:
                    eligibility.reason,
            };
        }


        /*
         * Если постоянной привязки
         * ещё не было, создаём её
         * ТОЛЬКО ПОСЛЕ успешной
         * eligibility проверки.
         */
        if (!linkedPlayer) {
            const linkResult =
                await this.playerAccountService
                    .linkPlayer(
                        telegramUserId,
                        resolvedPlayerId,
                    );


            if (!linkResult.success) {

                switch (
                    linkResult.reason
                ) {

                    case "PLAYER_NOT_FOUND":
                        return {
                            success:
                                false as const,

                            reason:
                                "PLAYER_NOT_FOUND" as const,
                        };


                    case "PLAYER_ALREADY_LINKED":
                        return {
                            success:
                                false as const,

                            reason:
                                "PLAYER_ID_ALREADY_USED" as const,
                        };


                    case "TELEGRAM_ALREADY_LINKED":
                        return {
                            success:
                                false as const,

                            reason:
                                "TELEGRAM_ALREADY_LINKED" as const,
                        };


                    case "USER_NOT_FOUND":
                        return {
                            success:
                                false as const,

                            reason:
                                "USER_NOT_FOUND" as const,
                        };
                }
            }
        }


        /*
         * Теперь создаём участие.
         */
        const participant =
            await this.participantRepository
                .create({
                    giveawayId,

                    telegramUserId,

                    casinoPlayerId:
                        resolvedPlayerId,
                });


        return {
            success:
                true as const,

            participant,

            casinoPlayerId:
                resolvedPlayerId,

            /*
             * Пригодится Telegram handler:
             * можно понимать, была ли
             * привязка уже до участия.
             */
            wasAlreadyLinked:
                Boolean(
                    linkedPlayer,
                ),
        };
    }
}