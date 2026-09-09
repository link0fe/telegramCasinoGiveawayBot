export type UserRole =
    | "PLAYER"
    | "PARTNER"
    | "ADMIN";

export type TelegramUserData = {
    telegramId: string;
    username?: string;
    firstName?: string;
};