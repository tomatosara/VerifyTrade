// mockTransactions.ts
export type TxStatus =
  | "success"                   // 交易成功
  | "initiator_not_scanned"     // 建立方尚未掃描 QR Code
  | "responder_not_scanned"     // 確認方尚未掃描 QR Code
  | "incomplete"                // 交易內容尚未填寫完成
  ;

export interface Transaction {
  id: string;            // 內部 id
  tradeId: string;       // 顯示給使用者的交易序號
  title: string;         // 簡短標題或項目
  amount?: number;       // 金額（選填）
  date: string;          // ISO 日期字串
  status: TxStatus;
  rating: number | null; // 星等 1~5，null = 尚未評價
  counterparty?: string; // 對方名稱（選填）
}

export const mockTransactions: Transaction[] = [
  {
    id: "tx_0001",
    tradeId: "TRX-20251107-9A1B",
    title: "二手相機交易",
    amount: 8500,
    date: "2025-11-01T14:32:00+08:00",
    status: "success",
    rating: 5,
    counterparty: "林小姐",
  },
  {
    id: "tx_0002",
    tradeId: "TRX-20251105-4C2D",
    title: "房屋押金（短租）",
    amount: 15000,
    date: "2025-11-03T09:10:00+08:00",
    status: "initiator_not_scanned",
    rating: null,
    counterparty: "王先生",
  },
  {
    id: "tx_0003",
    tradeId: "TRX-20251030-7E3F",
    title: "二手書籍交付",
    amount: 300,
    date: "2025-10-30T18:05:00+08:00",
    status: "responder_not_scanned",
    rating: null,
    counterparty: "陳太太",
  },
  {
    id: "tx_0004",
    tradeId: "TRX-20251028-A9Z0",
    title: "電子配件訂單",
    amount: 1200,
    date: "2025-10-28T11:22:00+08:00",
    status: "incomplete",
    rating: null,
    counterparty: "吳先生",
  },
  {
    id: "tx_0005",
    tradeId: "TRX-20250920-B4X7",
    title: "家具購買",
    amount: 4200,
    date: "2025-09-20T16:45:00+08:00",
    status: "success",
    rating: 4,
    counterparty: "李小姐",
  },
  {
    id: "tx_0006",
    tradeId: "TRX-20250815-C0M2",
    title: "課程代售",
    amount: 800,
    date: "2025-08-15T20:10:00+08:00",
    status: "success",
    rating: 3,
    counterparty: "吳老師",
  },
  {
    id: "tx_demo_locked",
    tradeId: "TRX-DEMO-LOCKED-001",
    title: "示範：等對方掃描",
    amount: 999,
    date: "2025-11-07T02:00:00+08:00",
    status: "responder_not_scanned",
    rating: null,
    counterparty: "示範帳號",
  },
];
