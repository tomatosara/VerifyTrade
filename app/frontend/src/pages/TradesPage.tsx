// src/pages/TradesPage.tsx
import { useEffect, useState } from 'react';
import { fetchTrades } from '@/api/trades';
import { TradeSummary } from '@/types/trades';
import { TradeFilterBar } from '@/components/trade/TradeFilerBar';
import { TradeTable } from '@/components/trade/TradeTable';
import { TradeDetailDrawer } from '@/components/trade/TradeDetailDrawer';

export function TradesPage() {
  const [trades, setTrades] = useState<TradeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const pageSize = 20;

  async function load() {
    const res = await fetchTrades({ page, pageSize, status });
    setTrades(res.items);
    setTotal(res.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">歷史交易紀錄</h1>

      <TradeFilterBar
        status={status}
        onStatusChange={setStatus}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />

      <TradeTable
        trades={trades}
        onRowClick={(uid) => setSelectedUid(uid)}
      />

      <TradeDetailDrawer
        uid={selectedUid}
        open={!!selectedUid}
        onClose={() => setSelectedUid(null)}
      />
    </div>
  );
}
