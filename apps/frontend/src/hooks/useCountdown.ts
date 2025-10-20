import { useEffect, useState } from "react";


export function useCountdown(seconds: number) {
const [left, setLeft] = useState(seconds);
useEffect(() => {
setLeft(seconds);
const t = setInterval(() => setLeft((x) => (x > 0 ? x - 1 : 0)), 1000);
return () => clearInterval(t);
}, [seconds]);
return left; // 剩餘秒數
}