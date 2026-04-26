import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import './App.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [userIp, setUserIp] = useState("IP 불러오는 중...");

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        const parts = data.ip.split('.');
        const maskedIp = `${parts[0]}.${parts[1]}.***.***`;
        setUserIp(maskedIp);
      })
      .catch(() => setUserIp("Unknown IP"));

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await addDoc(collection(db, "posts"), {
        userName: userIp,
        content: content,
        createdAt: serverTimestamp(),
      });
      setContent("");
    } catch (error) {
      alert("글쓰기에 실패했습니다. Firebase Rules 설정을 확인하세요.");
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🇻🇳🇰🇷 우리들의 놀이터</h1>
        <p className="sub-text">베트남 친구들을 위한 정보 나눔 공간 (Sân chơi cộng đồng Việt-Hàn)</p>
      </header>
      <section className="input-section">
        <div className="ip-display">📍 접속 주소: {userIp}</div>
        <form onSubmit={handleSubmit}>
          <textarea 
            placeholder="정보를 자유롭게 남겨주세요... (Hãy chia sẻ thông tin...)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          <button type="submit">글 올리기 (Đăng bài)</button>
        </form>
      </section>
      <section className="post-list">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <span className="user">{post.userName}</span>
              <span className="date">{post.createdAt?.toDate().toLocaleString() || "작성 중..."}</span>
            </div>
            <p className="post-content">{post.content}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
export default App;