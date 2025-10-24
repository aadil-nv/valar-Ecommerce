import { Request, Response } from "express";

export const errorHandler = (
  err: Error, 
  req: Request,
  res: Response,
) => {
  console.error(err);

  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
};
