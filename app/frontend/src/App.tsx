import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";
import NewForm from "./pages/newform";
import OpenForm from "./pages/openform";
import MyAccount from "./pages/myaccount";



function App() {
  return (
    <BrowserRouter>
      {/* 導覽列（全站共用） */}
      <Navbar />

      {/* 路由區塊：控制不同網址顯示不同頁面 */}
      <Routes>
        <Route path="/" element={<Home />} />   {/* ← 顯示 Home.tsx */}
        <Route path="/login" element={<Login />} />  
        <Route path="/newform" element={<NewForm />} />   
        <Route path="/openform" element={<OpenForm />} />
        <Route path="/myaccount" element={<MyAccount />} />   
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
