import axios from "axios";


export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || "http://localhost:4000" });


api.interceptors.response.use(
    (res) => res,
    (err) => {
    // 可在這裡統一處理錯誤提示
    return Promise.reject(err);
    }
);