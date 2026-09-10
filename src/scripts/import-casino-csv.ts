import path from "node:path";

import {
    CasinoCsvImportService,
} from "../modules/casino/casino-csv-import.service.js";


const fileArgument =
    process.argv[2];


if (!fileArgument) {
    console.error(
        "Usage: npm.cmd run casino:import -- <csv-file>",
    );

    process.exit(1);
}


const filePath =
    path.resolve(
        fileArgument,
    );


const service =
    new CasinoCsvImportService();


const result =
    await service.importFile(
        filePath,
    );


console.log(
    "\n=== CASINO CSV IMPORT ===",
);

console.log(
    `Rows: ${result.totalRows}`,
);

console.log(
    `Imported: ${result.imported}`,
);

console.log(
    `Skipped: ${result.skipped}`,
);