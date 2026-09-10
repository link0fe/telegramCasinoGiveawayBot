import fs from "node:fs";

import {
    parse,
} from "csv-parse/sync";

import {
    db,
} from "../../database/db.js";

import {
    casinoPlayers,
} from "../../database/schema.js";


type CsvRow =
    Record<string, string>;


export class CasinoCsvImportService {

    private normalizeHeader(
        value: string,
    ) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "");
    }


    private getValue(
        row: CsvRow,
        aliases: string[],
    ) {
        const entries =
            Object.entries(row);


        for (
            const alias
            of aliases
        ) {
            const normalizedAlias =
                this.normalizeHeader(
                    alias,
                );


            const found =
                entries.find(
                    ([key]) =>
                        this.normalizeHeader(
                            key,
                        ) ===
                        normalizedAlias,
                );


            if (found) {
                return String(
                    found[1] ?? "",
                ).trim();
            }
        }


        return "";
    }


    private toNumber(
        value: string,
    ) {
        if (!value) {
            return 0;
        }


        const normalized =
            value
                .replace(/\s/g, "")
                .replace(",", ".");


        const number =
            Number(normalized);


        return Number.isFinite(number)
            ? number
            : 0;
    }


    async importFile(
        filePath: string,
    ) {
        if (
            !fs.existsSync(
                filePath,
            )
        ) {
            throw new Error(
                `CSV file not found: ${filePath}`,
            );
        }


        const csv =
            fs.readFileSync(
                filePath,
                "utf8",
            );


        const rows =
            parse(csv, {
                columns: true,
                skip_empty_lines: true,
                bom: true,
                trim: true,
            }) as CsvRow[];


        let imported = 0;
        let skipped = 0;


        for (
            const row
            of rows
        ) {
            const playerId =
                this.getValue(
                    row,
                    [
                        "Player ID",
                        "PlayerID",
                        "Player Id",
                    ],
                );


            const affiliateId =
                this.getValue(
                    row,
                    [
                        "Affiliate ID",
                        "AffiliateID",
                        "Affiliate Id",
                    ],
                );


            const affiliateName =
                this.getValue(
                    row,
                    [
                        "Affiliate Name",
                        "AffiliateName",
                    ],
                );


            const firstDepositCount =
                this.toNumber(
                    this.getValue(
                        row,
                        [
                            "First Deposit Count",
                            "FirstDepositCount",
                        ],
                    ),
                );


            const firstDepositAmount =
                this.toNumber(
                    this.getValue(
                        row,
                        [
                            "First deposits, $",
                            "First Deposit Amount",
                            "FirstDepositAmount",
                        ],
                    ),
                );

            const registrationDateRaw =
                this.getValue(
                    row,
                    [
                        "Registration date",
                        "Registration Date",
                    ],
                );

            const firstDepositDateRaw =
                this.getValue(
                    row,
                    [
                        "First deposit date",
                        "First Deposit Date",
                    ],
                );

            const registrationDate =
                registrationDateRaw === "-" ||
                registrationDateRaw === ""
                    ? null
                    : registrationDateRaw;

            const firstDepositDate =
                firstDepositDateRaw === "-" ||
                firstDepositDateRaw === ""
                    ? null
                    : firstDepositDateRaw;

            if (
                !playerId ||
                !affiliateId
            ) {
                skipped++;

                continue;
            }


            await db
                .insert(
                    casinoPlayers,
                )
                .values({
                    playerId,
                    affiliateId,
                    affiliateName,

                    firstDepositCount:
                        Math.trunc(
                            firstDepositCount,
                        ),

                    firstDepositAmount,
                    registrationDate,
                    firstDepositDate,

                    importedAt:
                        new Date(),
                })
                .onConflictDoUpdate({
                    target:
                        casinoPlayers.playerId,

                    set: {
                        affiliateId,
                        affiliateName,

                        firstDepositCount:
                            Math.trunc(
                                firstDepositCount,
                            ),

                        firstDepositAmount,
                        registrationDate,
                        firstDepositDate,

                        importedAt:
                            new Date(),
                    },
                });


            imported++;
        }


        return {
            totalRows:
                rows.length,

            imported,

            skipped,
        };
    }
}