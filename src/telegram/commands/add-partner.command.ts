import type { Bot } from "grammy";
import type { BotContext } from "../session/bot-session.js";

import { UserService } from "../../modules/users/user.service.js";
import { PartnerService } from "../../modules/partners/partner.service.js";

const userService = new UserService();
const partnerService = new PartnerService();

export function registerAddPartnerCommand(
    bot: Bot<BotContext>,
) {
    bot.command(
        "addpartner",
        async (ctx) => {
            const telegramUser = ctx.from;

            if (!telegramUser) {
                return;
            }

            const admin =
                await userService
                    .getOrCreateTelegramUser({
                        telegramId:
                            String(
                                telegramUser.id,
                            ),
                        username:
                            telegramUser.username,
                        firstName:
                            telegramUser.first_name,
                    });

            if (admin.role !== "ADMIN") {
                await ctx.reply(
                    "⛔ Эта команда доступна только администратору.",
                );

                return;
            }

            const args =
                ctx.message.text
                    .split(" ")
                    .slice(1);

            const [
                telegramId,
                affiliateId,
                ...nameParts
            ] = args;

            const name =
                nameParts.join(" ");

            if (
                !telegramId ||
                !affiliateId ||
                !name
            ) {
                await ctx.reply(
                    "Использование:\n/addpartner <telegramId> <affiliateId> <name>",
                );

                return;
            }

            try {
                const partner =
                    await partnerService
                        .createPartner({
                            telegramId,
                            affiliateId,
                            name,
                        });

                await ctx.reply(
                    `✅ Партнер создан

ID: ${partner.id}
Название: ${partner.name}
Affiliate ID: ${partner.affiliateId}`,
                );
            } catch (error) {
                if (
                    error instanceof Error
                ) {
                    switch (
                        error.message
                    ) {
                        case "USER_NOT_FOUND":
                            await ctx.reply(
                                "❌ Этот Telegram-пользователь еще не запускал бота через /start.",
                            );
                            return;

                        case "USER_ALREADY_PARTNER":
                            await ctx.reply(
                                "❌ Этот пользователь уже является партнером.",
                            );
                            return;

                        case "AFFILIATE_ALREADY_EXISTS":
                            await ctx.reply(
                                "❌ Такой Affiliate ID уже используется.",
                            );
                            return;
                    }
                }

                console.error(error);

                await ctx.reply(
                    "❌ Не удалось создать партнера.",
                );
            }
        },
    );
}