import { describe, it, expect, vi } from "vitest";
import axios from "axios";


vi.mock("axios");


describe("/verifier/qrcode", () => {
it("should return transactionId and qrcodeImage", async () => {
// mock axios.get 回應 ... 斟酌實作
expect(true).toBe(true);
});
});