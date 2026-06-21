import { Response } from "express";

type body = {
  message: string;
  data: any;
};

const response = (res: Response, status: number, { message, data }: body) => {
  return res.status(status).json({ message, data });
};

export { response, body };
