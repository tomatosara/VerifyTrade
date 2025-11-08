// src/components/trade/TradeFilterBar.tsx
interface Props {
  status?: string;
  onStatusChange: (status?: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function TradeFilterBar({
  status,
  onStatusChange,
  page,
  pageSize,
  total,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">狀態</span>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={status || ''}
          onChange={(e) =>
            onStatusChange(e.target.value || undefined)
          }
        >
          <option value="">全部</option>
          <option value="done">完成</option>
          <option value="pending">審核中</option>
          <option value="verified">已驗證</option>
          <option value="confirmed">已確認</option>
          <option value="failed">失敗</option>
          <option value="cancelled">取消</option>
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          上一頁
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一頁
        </button>
      </div>
    </div>
  );
}
