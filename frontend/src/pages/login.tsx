export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-6">登入帳號</h1>
      <form className="flex flex-col gap-3 w-64">
        <input
          type="email"
          placeholder="輸入 Email"
          className="p-2 border rounded"
        />
        <input
          type="password"
          placeholder="輸入密碼"
          className="p-2 border rounded"
        />
        <button className="bg-blue-600 text-white py-2 rounded">登入</button>
      </form>
    </div>
  );
}
