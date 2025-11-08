// src/components/navbar.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { api, setAccessToken } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { mockUser } from "@/mocks/mockUser"; // ✅ 引入 mock 資料

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser } = useAuth();
  const toggleMenu = () => setIsOpen(prev => !prev);
  

  // 🚀 初始化檢查登入狀態
  useEffect(() => {
    (async () => {
      try {
        // ⚙️ 若要切換為實際登入檢查，把 mockUser 註解掉、開啟 checkLogin
        const me = await checkLogin();
        setUser(me);
        // setUser(mockUser); // ✅ 假登入用
      } catch (err) {
        console.warn("檢查登入狀態時發生錯誤：", err);
      }
    })();
  }, []);

  // 🚪 登出
  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("登出時發生錯誤:", err);
    } finally {
      setAccessToken(null); // 清除記憶體 token
      setUser(null);        // 清除全域 user 狀態
      navigate("/login");
    }
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm relative">
      {/* 🔹 左側 Logo */}
      <div className="flex items-center space-x-2">
        <img src="/image/icon.png" alt="Logo" className="h-8" />
        <Link
          to="/"
          className="font-semibold text-xl md:text-2xl text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          零知識防詐交易平台
        </Link>
      </div>

      {/* 🔹 桌機導覽連結 */}
      <ul className="absolute left-1/2 -translate-x-1/2 hidden md:flex space-x-8 text-basic text-gray-700 font-medium">
        <li>
          <Link to="/newform" className="hover:text-[var(--color-primary)] transition">
            建立表單
          </Link>
        </li>
        <li>
          <Link to="/openform" className="hover:text-[var(--color-primary)] transition">
            交易序號
          </Link>
        </li>
        <li>
          <Link to="/guide" className="hover:text-[var(--color-primary)] transition">
            常見問題
          </Link>
        </li>
      </ul>

      {/* 🔹 右側登入狀態（桌機版） */}
      <div className="hidden md:flex space-x-8 items-center">
        {user ? (
          <>
            <span className="text-gray-700 text-basic">
              👋 您好，{user.name ?? user.idNumber ?? "使用者"}
            </span>

            {/* 我的帳號按鈕 */}
            <Link
              to="/myaccount"
              className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-secondary)] text-basic"
            >
              我的帳號
            </Link>

            {/* 登出按鈕 */}
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-800 text-basic px-4 py-2 rounded-full hover:bg-gray-300 transition"
            >
              登出
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-[var(--color-primary)] text-basic text-white px-4 py-2 rounded-full hover:bg-[var(--color-primary)]/80 transition"
          >
            註冊 / 登入
          </Link>
        )}
      </div>

      {/* 🔹 手機版漢堡按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-gray-700 focus:outline-none py-4"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* 🔹 手機版展開選單 */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col items-center py-4 space-y-6 md:hidden z-50">
          <Link to="/newform" className="text-gray-700 hover:text-[var(--color-primary)]">
            建立表單
          </Link>
          <Link to="/openform" className="text-gray-700 hover:text-[var(--color-primary)]">
            交易序號
          </Link>
          <Link to="/guide" className="text-gray-700 hover:text-[var(--color-primary)]">
            常見問題
          </Link>
          <hr className="w-4/5 border-gray-200" />

          {user ? (
            <>
              <Link
                to="/myaccount"
                className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-secondary)]"
              >
                我的帳號
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-800 px-8 py-2 rounded-full hover:bg-gray-300"
              >
                登出
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-[var(--color-primary)] text-white px-8 py-2 rounded-full hover:bg-[var(--color-primary)]/80"
            >
              登入 / 註冊
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
