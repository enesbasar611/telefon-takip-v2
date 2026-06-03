export const normalizePhoneNumber = (value?: string | null) => {
    let digits = (value || "").replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("90")) digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(-10);
};
