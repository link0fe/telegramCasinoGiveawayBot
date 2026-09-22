import type { Api } from "grammy";

export class TelegramSubscriptionService {
    constructor(
        private readonly api: Api,
    ) {}

    async isSubscribed(
        channelUsername: string,
        telegramUserId: number,
    ): Promise<boolean> {
        try {
            const member =
                await this.api.getChatMember(
                    channelUsername,
                    telegramUserId,
                );

            switch (member.status) {
                case "creator":
                case "administrator":
                case "member":
                    return true;

                case "restricted":
                    return member.is_member;

                case "left":
                case "kicked":
                    return false;

                default:
                    return false;
            }
        } catch (error) {
            console.error(
                "Telegram subscription check failed:",
                error,
            );

            throw new Error(
                "SUBSCRIPTION_CHECK_FAILED",
            );
        }
    }
}