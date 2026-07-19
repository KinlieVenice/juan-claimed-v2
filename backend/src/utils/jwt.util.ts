import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export type AuthTokenPayload = { sub: string };

export const signAuthToken = (userId: string): string => {
  return jwt.sign({ sub: userId } satisfies AuthTokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
};
