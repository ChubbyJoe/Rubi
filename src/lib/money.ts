// Money is whole kobo everywhere; naira only appear on screen.
const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });

export const formatNaira = (kobo: number) => naira.format(kobo / 100);
