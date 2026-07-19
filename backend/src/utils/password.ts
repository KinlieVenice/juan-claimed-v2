import bcrypt from "bcrypt";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
