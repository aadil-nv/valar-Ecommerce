import { bgMagenta } from "colors";
import { Request, Response, NextFunction } from "express";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const ms = Math.round(diff[0] * 1000 + diff[1] / 1e6); 

    console.log(
      `📡 ${req.method} 🔗 ${req.originalUrl} ✅ ${res.statusCode} - ${ms} ms`.bgMagenta.bold
    );
  });

  next();
};
