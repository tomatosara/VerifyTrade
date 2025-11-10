import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";
import NewForm from "./pages/newform";
import OpenForm from "./pages/openform";
import VerifyForm from "./pages/verifyform";
import MyAccount from "./pages/myaccount";
import { AuthProvider } from "./context/AuthContext";
import Question from "./pages/question";



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* 導覽列（全站共用） */}
        <Navbar />

        {/* 路由區塊：控制不同網址顯示不同頁面 */}
        <Routes>
          <Route path="/" element={<Home />} />   {/* ← 顯示 Home.tsx */}
          <Route path="/login" element={<Login />} />
          <Route path="/newform" element={<NewForm />} />
          <Route path="/openform" element={<OpenForm />} />
          <Route path="/verify/:uid" element={<VerifyForm />} />
          <Route path="/myaccount" element={<MyAccount />} />
          <Route path="/question" element={<Question />} />   

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
