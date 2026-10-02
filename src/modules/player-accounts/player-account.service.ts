import {
    PlayerAccountRepository,
} from "./player-account.repository.js";


export class PlayerAccountService {

    constructor(
        private readonly repository =
            new PlayerAccountRepository(),
    ) {}


    /*
     * Получить уже привязанный
     * casino account пользователя.
     */
    async getLinkedPlayer(
        telegramId: string,
    ) {
        const result =
            await this.repository
                .findByTelegramId(
                    telegramId,
                );


        if (!result) {
            return null;
        }


        return result.casinoPlayer;
    }


    /*
     * Привязать Player ID
     * к Telegram пользователю.
     *
     * ВАЖНО:
     * этот метод пока только создаёт связь.
     * Eligibility giveaway здесь
     * специально не проверяем.
     */
    async linkPlayer(
        telegramId: string,
        playerId: string,
    ) {

        /*
         * У Telegram пользователя
         * уже есть привязка.
         */
        const existingLink =
            await this.repository
                .findByTelegramId(
                    telegramId,
                );


        if (existingLink) {

            /*
             * Повторная привязка
             * того же аккаунта —
             * нормальная ситуация.
             */
            if (
                existingLink
                    .casinoPlayer
                    .playerId ===
                playerId
            ) {
                return {
                    success:
                        true as const,

                    casinoPlayer:
                        existingLink
                            .casinoPlayer,

                    alreadyLinked:
                        true,
                };
            }


            return {
                success:
                    false as const,

                reason:
                    "TELEGRAM_ALREADY_LINKED" as const,
            };
        }


        /*
         * Проверяем существование
         * Player ID в casino_players.
         */
        const casinoPlayer =
            await this.repository
                .findCasinoPlayer(
                    playerId,
                );


        if (!casinoPlayer) {
            return {
                success:
                    false as const,

                reason:
                    "PLAYER_NOT_FOUND" as const,
            };
        }


        /*
         * Проверяем, что этот casino player
         * ещё не принадлежит другому
         * Telegram аккаунту.
         */
        const existingPlayerLink =
            await this.repository
                .findByCasinoPlayerId(
                    casinoPlayer.id,
                );


        if (existingPlayerLink) {
            return {
                success:
                    false as const,

                reason:
                    "PLAYER_ALREADY_LINKED" as const,
            };
        }


        /*
         * Получаем нашего users.id.
         */
        const user =
            await this.repository
                .findUserByTelegramId(
                    telegramId,
                );


        if (!user) {
            return {
                success:
                    false as const,

                reason:
                    "USER_NOT_FOUND" as const,
            };
        }


        /*
         * Создаём постоянную связь.
         */
        await this.repository
            .create(
                user.id,
                casinoPlayer.id,
            );


        return {
            success:
                true as const,

            casinoPlayer,

            alreadyLinked:
                false,
        };
    }
}