import { useEffect, useRef } from "react";


export function usePolling(fn: () => Promise<void>, intervalMs: number, enabled: boolean) {
const timer = useRef<number | null>(null);
useEffect(() => {
if (!enabled) return;
const run = async () => { try { await fn(); } catch {} };
run();
timer.current = window.setInterval(run, intervalMs);
return () => { if (timer.current) window.clearInterval(timer.current); };
}, [fn, intervalMs, enabled]);
}