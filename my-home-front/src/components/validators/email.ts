export const EmailValidator = (email: string) => {
    const valid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(email);
    return valid ? true : false;
};