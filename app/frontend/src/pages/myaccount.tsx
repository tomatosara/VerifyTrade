import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MyAccountTradeList } from "@/components/trade/MyAccountTradeList";

const DEFAULT_AVATAR =
  "https://api.dicebear.com/8.x/identicon/svg?seed=verifytrade-user";

function MyAccount() {
  const { user, loading } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        載入中...
      </div>
    );
  }

  const displayAvatar = avatar || DEFAULT_AVATAR;

  return (
    <div className="min-h-screen bg-[#FFF5F7]">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* 頭像 + 基本資料 */}
        <div className="flex items-center gap-8 mb-10">
          <div className="relative">
            <img
              src={displayAvatar}
              alt="avatar"
              className="w-28 h-28 rounded-full bg-pink-200 object-cover shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-pink-400 text-white text-xs py-1 px-3 rounded-full cursor-pointer hover:bg-pink-500 transition">
              更換
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {user?.name ?? "使用者"}
            </h1>
            <p className="text-gray-600 text-sm">
              身分證號：{user?.idNumber ?? "-"}
            </p>
            <p className="text-gray-600 text-sm">
              角色：{user?.role ?? "user"}
            </p>
            <p className="text-gray-600 text-sm">
              生日：{user?.birthday ?? "-"}
            </p>
          </div>
        </div>

        {/* 標題區（跟原設計一樣） */}
        <div className="mb-3">
          <p className="text-sm text-gray-600">交易列表</p>
          <h2 className="text-xl font-semibold text-gray-800">
            交易紀錄
          </h2>
        </div>

        <MyAccountTradeList />
      </div>
    </div>
  );
}

export default MyAccount;
