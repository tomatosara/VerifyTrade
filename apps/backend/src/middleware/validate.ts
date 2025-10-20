import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';


export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
const r = schema.safeParse(req.body);
if (!r.success) return res.status(400).json({ code: 400, message: 'Invalid body', issues: r.error.issues });
// 可把 parse 後資料掛到 req.body 上
// @ts-expect-error override for convenience
req.body = r.data;
next();
};