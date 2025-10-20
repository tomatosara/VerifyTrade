import VerifierDemo from "./components/VerifierDemo";
import IssuerDemo from "./components/IssuerDemo";

export default function App() {
return (
    <main className="p-6">
    <h1 className="text-2xl font-bold">零知識防詐交易平台｜驗證端 Demo</h1>
    <p className="text-gray-600">Token 僅在後端，前端只呼叫自家 API。</p>
    <div className="mt-6"><VerifierDemo /></div>
    <h1 className="text-2xl font-bold mt-6">零知識防詐交易平台｜發行端 Demo</h1>
    <div className="mt-6"><IssuerDemo /></div>
    </main>
    );
}