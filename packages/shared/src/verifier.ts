import { z } from "zod";


export const VerifierQrcodeRequest = z.object({
ref: z.string().min(1),
});
export type TVerifierQrcodeRequest = z.infer<typeof VerifierQrcodeRequest>;


export const VerifierQrcodeResponse = z.object({
transactionId: z.string().uuid(),
qrcodeImage: z.string().optional(),
authUri: z.string().optional(),
});
export type TVerifierQrcodeResponse = z.infer<typeof VerifierQrcodeResponse>;


export const VerifierResultRequest = z.object({
transactionId: z.string().uuid(),
});
export type TVerifierResultRequest = z.infer<typeof VerifierResultRequest>;


export const VerifierResultResponse = z.object({
verifyResult: z.boolean().optional(),
resultDescription: z.string().optional(),
transactionId: z.string().uuid().optional(),
data: z
.array(
z.object({
credentialType: z.string(),
claims: z.array(
z.object({ ename: z.string(), cname: z.string().optional(), value: z.any() })
),
})
)
.optional(),
});
export type TVerifierResultResponse = z.infer<typeof VerifierResultResponse>;