export const homeCodeValidator = (code: string) => {
    return /^\d{4}$/.test(code);
};
