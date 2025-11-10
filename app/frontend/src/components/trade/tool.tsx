export function formatStatus(status: string | null | undefined): string {
  switch (status) {
    case "done":
      return "交易完成";
    case "pending":
      return "等待確認方驗證";
    case "verified":
      return "已驗證";
    case "confirmed":
      return "交易成立";
    case "failed":
      return "交易失敗";
    case "cancelled":
      return "已取消";
    default:
      return status || "-";
  }
}

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("zh-TW") : "-";

export const formatAmount = (value?: string | null) =>
  value ? parseFloat(value).toFixed(1) : "-";