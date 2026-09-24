import {
    VoucherRepository,
} from "../modules/vouchers/voucher.repository.js";

const repository =
    new VoucherRepository();
    
const testVouchers = [
    {
        code: "DEMO-USD-50-001",
        amount: 50,
        currency: "USD",
    },
    {
        code: "DEMO-USD-50-002",
        amount: 50,
        currency: "USD",
    },
    {
        code: "DEMO-USD-100-001",
        amount: 100,
        currency: "USD",
    },
];

for (const voucher of testVouchers) {
    const created =
        await repository.create(
            voucher.code,
            voucher.amount,
            voucher.currency,
        );

    if (created) {
        console.log(
            `Added: ${voucher.code}`,
        );
    } else {
        console.log(
            `Already exists: ${voucher.code}`,
        );
    }
}

console.log(
    "\nVouchers:",
);

const vouchers =
    await repository.findAll();

console.table(
    vouchers,
);