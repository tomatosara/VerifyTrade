function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to My Home Page 🏠</h1>
      <p>這是你網站的首頁，可以放按鈕、圖片或介紹內容。</p>
      <button onClick={() => alert("你點到按鈕了！")}>
        點我試試看
      </button>
    </div>
  );
}

export default Home;
