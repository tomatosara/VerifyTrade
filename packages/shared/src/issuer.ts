import { z } from "zod";


export const IssuerQrcodeDataRequest = z.object({
vcUid: z.string(),
issuanceDate: z.string().regex(/^\d{8}$/),
expiredDate: z.string().regex(/^\d{8}$/),
fields: z.array(z.object({ ename: z.string(), content: z.string() })).default([]),
});
export type TIssuerQrcodeDataRequest = z.infer<typeof IssuerQrcodeDataRequest>;


export const IssuerQrcodeNoDataRequest = z.object({
vcUid: z.string(),
});
export type TIssuerQrcodeNoDataRequest = z.infer<typeof IssuerQrcodeNoDataRequest>;


export const IssuerQrcodeResponse = z.object({
transactionId: z.string().uuid(),
qrCode: z.string().optional(),
deepLink: z.string().optional(),
});
export type TIssuerQrcodeResponse = z.infer<typeof IssuerQrcodeResponse>;