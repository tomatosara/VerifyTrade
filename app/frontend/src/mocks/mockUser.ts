// mockUser.ts
export interface MockUser {
  id: string;
  name: string;
  email?: string;
  avatar: string; // 可以放相對路徑或 data URL
}

export const mockUser: MockUser = {
  id: "user_00321",
  name: "Sara",
  avatar: "/image/default-avatar.png",
};
