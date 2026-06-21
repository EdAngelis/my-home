export const cpfValidator = (cpf: string) => {
    const regex = /^(?:(\d)\1{10})$|(\D)|^(\d{12,})$|^(\d{0,10})$/g;
    return !regex.test(cpf);
};