import { InlineKeyboard } from "grammy";


export function createPlayerKeyboard() {

    return new InlineKeyboard()
        .text(
            "🎁 Розыгрыши",
            "player:giveaways",
        )
        .row()
        .text(
            "👤 Профиль",
            "profile",
        );
}


export function createPartnerKeyboard() {

    return new InlineKeyboard()
        .text(
            "➕ Создать розыгрыш",
            "partner:create-giveaway",
        )
        .row()
        .text(
            "🎁 Мои розыгрыши",
            "partner:giveaways",
        )
        .row()
        .text(
            "👤 Профиль",
            "profile",
        );
}


export function createAdminKeyboard() {

    return new InlineKeyboard()
        .text(
            "👥 Партнеры",
            "admin:partners",
        )
        .row()
        .text(
            "🎁 Все розыгрыши",
            "admin:giveaways",
        )
        .row()
        .text(
            "📊 Данные казино",
            "admin:casino-data",
        )
        .row()
        .text(
            "👤 Профиль",
            "profile",
        );
}