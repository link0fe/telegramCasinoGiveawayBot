import fs from "node:fs";

import {
    VoucherRepository,
} from "./voucher.repository.js";


type ParsedVoucher = {
    code: string;
    amount: number;
    currency: string;
};


type ParseError = {
    line: number;
    content: string;
    reason: string;
};


export class VoucherImportService {

    constructor(
        private readonly voucherRepository =
            new VoucherRepository(),
    ) {}


    /*
     * ================================
     * IMPORT FROM FILE
     * ================================
     */
    async importFile(
        filePath: string,
    ) {

        const content =
            fs.readFileSync(
                filePath,
                "utf8",
            );


        return await this.importText(
            content,
        );
    }


    /*
     * ================================
     * IMPORT FROM TELEGRAM TEXT
     * ================================
     */
    async importText(
        rawContent: string,
    ) {

        const content =
            rawContent
                .replace(
                    /^\uFEFF/,
                    "",
                )
                .trim();


        if (!content) {
            throw new Error(
                "VOUCHER_DATA_EMPTY",
            );
        }


        const lines =
            content
                .split(
                    /\r?\n/,
                )
                .map(
                    (line) =>
                        line.trim(),
                )
                .filter(
                    (line) =>
                        line.length >
                        0,
                );


        if (
            lines.length ===
            0
        ) {
            throw new Error(
                "VOUCHER_DATA_EMPTY",
            );
        }


        const parsed: ParsedVoucher[] =
            [];

        const errors: ParseError[] =
            [];

        const codesInFile =
            new Set<string>();


        let dataRows =
            0;


        /*
         * ================================
         * PARSE ALL ROWS FIRST
         * ================================
         */
        for (
            let index = 0;
            index < lines.length;
            index++
        ) {

            const line =
                lines[index]!;


            /*
             * Optional CSV header.
             */
            if (
                index === 0 &&
                this.isHeader(
                    line,
                )
            ) {
                continue;
            }


            dataRows++;


            const result =
                this.parseLine(
                    line,
                );


            if (!result) {

                errors.push({
                    line:
                        index + 1,

                    content:
                        line,

                    reason:
                        "Не удалось определить код ваучера и сумму.",
                });


                continue;
            }


            if (
                codesInFile.has(
                    result.code,
                )
            ) {

                errors.push({
                    line:
                        index + 1,

                    content:
                        line,

                    reason:
                        `Код ${result.code} повторяется внутри списка.`,
                });


                continue;
            }


            codesInFile.add(
                result.code,
            );


            parsed.push(
                result,
            );
        }


        /*
         * Если хотя бы одна строка
         * невалидна — ничего не импортируем.
         */
        if (
            errors.length >
            0
        ) {

            return {
                success:
                    false as const,

                totalRows:
                    dataRows,

                errors,
            };
        }


        let imported =
            0;

        let duplicates =
            0;


        const importedByAmount =
            new Map<
                string,
                {
                    amount: number;
                    currency: string;
                    count: number;
                }
            >();


        /*
         * ================================
         * WRITE TO DATABASE
         * ================================
         */
        for (
            const voucher
            of parsed
        ) {

            const existing =
                await this.voucherRepository
                    .findByCode(
                        voucher.code,
                    );


            if (existing) {

                duplicates++;

                continue;
            }


            const created =
                await this.voucherRepository
                    .create(
                        voucher.code,
                        voucher.amount,
                        voucher.currency,
                    );


            /*
             * Защита от race condition /
             * UNIQUE conflict.
             */
            if (!created) {

                duplicates++;

                continue;
            }


            imported++;


            const key =
                `${voucher.amount}:${voucher.currency}`;


            const current =
                importedByAmount.get(
                    key,
                );


            if (current) {

                current.count++;

            } else {

                importedByAmount.set(
                    key,
                    {
                        amount:
                            voucher.amount,

                        currency:
                            voucher.currency,

                        count:
                            1,
                    },
                );
            }
        }


        return {
            success:
                true as const,

            totalRows:
                dataRows,

            imported,

            duplicates,

            denominations:
                Array.from(
                    importedByAmount.values(),
                ).sort(
                    (a, b) =>
                        a.amount -
                        b.amount,
                ),
        };
    }


    /*
     * ================================
     * HEADER DETECTION
     * ================================
     */
    private isHeader(
        line: string,
    ) {

        const normalized =
            line
                .trim()
                .toLowerCase();


        return (
            /^code\s*[,;\t]\s*amount/.test(
                normalized,
            ) ||
            /^код\s*[,;\t]\s*(amount|сумма)/.test(
                normalized,
            )
        );
    }


    /*
     * ================================
     * PARSE ONE LINE
     * ================================
     *
     * Поддерживает:
     *
     * CODE<TAB>1000 р 1 акт
     *
     * CODE;1000 р 1 акт
     *
     * CODE,1000 р 1 акт
     *
     * CODE,1000,RUB
     *
     * CODE 1000 р 1 акт
     */
    private parseLine(
        rawLine: string,
    ): ParsedVoucher | null {

        const line =
            rawLine.trim();


        if (!line) {
            return null;
        }


        /*
         * Сначала отделяем code
         * от остальной части строки.
         */
        const separated =
            this.splitLine(
                line,
            );


        if (!separated) {
            return null;
        }


        const code =
            this.cleanCode(
                separated.code,
            );


        if (!code) {
            return null;
        }


        /*
         * Немного защищаемся от
         * случайного мусора.
         */
        if (
            code.length <
            2
        ) {
            return null;
        }


        const data =
            separated.data
                .trim();


        if (!data) {
            return null;
        }


        /*
         * Первая числовая последовательность
         * после code считается номиналом.
         *
         * 1000 р 1 акт
         *
         * amount = 1000
         *
         * "1 акт" не используется.
         */
        const amountMatch =
            data.match(
                /(\d+(?:[.,]\d+)?)/,
            );


        if (!amountMatch) {
            return null;
        }


        const amount =
            Number(
                amountMatch[1]!
                    .replace(
                        ",",
                        ".",
                    ),
            );


        if (
            !Number.isFinite(
                amount,
            ) ||
            amount <= 0
        ) {
            return null;
        }


        /*
         * ================================
         * CURRENCY
         * ================================
         *
         * "р", "руб", "₽", "RUB"
         * считаем RUB.
         *
         * Если валюта вообще не указана —
         * тоже RUB.
         *
         * USD/EUR оставляем на будущее.
         */
        const normalized =
            data
                .toUpperCase();


        let currency =
            "RUB";


        if (
            /\bUSD\b/.test(
                normalized,
            ) ||
            normalized.includes(
                "$",
            )
        ) {

            currency =
                "USD";

        } else if (
            /\bEUR\b/.test(
                normalized,
            ) ||
            normalized.includes(
                "€",
            )
        ) {

            currency =
                "EUR";

        } else {

            currency =
                "RUB";
        }


        return {
            code,
            amount,
            currency,
        };
    }


    /*
     * ================================
     * SPLIT LINE
     * ================================
     */
    private splitLine(
        line: string,
    ): {
        code: string;
        data: string;
    } | null {

        /*
         * TAB — приоритетный формат
         * для твоих текущих данных.
         */
        const tabIndex =
            line.indexOf(
                "\t",
            );


        if (
            tabIndex >
            0
        ) {

            return {
                code:
                    line.slice(
                        0,
                        tabIndex,
                    ),

                data:
                    line.slice(
                        tabIndex + 1,
                    ),
            };
        }


        /*
         * Semicolon CSV.
         */
        const semicolonIndex =
            line.indexOf(
                ";",
            );


        if (
            semicolonIndex >
            0
        ) {

            return {
                code:
                    line.slice(
                        0,
                        semicolonIndex,
                    ),

                data:
                    line.slice(
                        semicolonIndex + 1,
                    ),
            };
        }


        /*
         * Comma CSV.
         */
        const commaIndex =
            line.indexOf(
                ",",
            );


        if (
            commaIndex >
            0
        ) {

            return {
                code:
                    line.slice(
                        0,
                        commaIndex,
                    ),

                data:
                    line.slice(
                        commaIndex + 1,
                    ),
            };
        }


        /*
         * Plain Telegram text:
         *
         * CODE    1000 р 1 акт
         *
         * Один или несколько пробелов.
         */
        const whitespaceMatch =
            line.match(
                /^(\S+)\s+(.+)$/,
            );


        if (
            !whitespaceMatch
        ) {
            return null;
        }


        return {
            code:
                whitespaceMatch[1]!,

            data:
                whitespaceMatch[2]!,
        };
    }


    /*
     * ================================
     * CLEAN CODE
     * ================================
     */
    private cleanCode(
        value: string,
    ) {

        return value
            .trim()
            .replace(
                /^["']+|["']+$/g,
                "",
            );
    }
}