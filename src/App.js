import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase-config';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import './App.css';

const GEO_URL = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo.json';

function App() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.latitude && data.longitude) {
          setUserCoords({ lat: data.latitude, lng: data.longitude });
        }
      })
      .catch(() => {});

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribeDb = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
      const coords = data
        .filter(p => p.lat && p.lng)
        .map(p => ({ lat: p.lat, lng: p.lng }));
      setMarkers(coords);
    });

    return () => { unsubscribeAuth(); unsubscribeDb(); };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      alert("로그인에 실패했습니다.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    try {
      await addDoc(collection(db, "posts"), {
        userName: user.displayName,
        userPhoto: user.photoURL,
        uid: user.uid,
        content: content,
        createdAt: serverTimestamp(),
        lat: userCoords?.lat || null,
        lng: userCoords?.lng || null,
      });
      setContent("");
    } catch (error) {
      alert("글쓰기에 실패했습니다.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    await deleteDoc(doc(db, "posts", id));
  };

  const handleEditStart = (post) => {
    setEditId(post.id);
    setEditContent(post.content);
  };

  const handleEditSave = async (id) => {
    if (!editContent.trim()) return;
    await updateDoc(doc(db, "posts", id), { content: editContent });
    setEditId(null);
    setEditContent("");
  };

  return (
    <div className="container">
      <header>
        <h1>🇻🇳🇰🇷 우리들의 놀이터</h1>
        <p className="sub-text">베트남 친구들을 위한 정보 나눔 공간 (Sân chơi cộng đồng Việt-Hàn)</p>
        <div className="auth-section">
          {user ? (
            <div className="user-info">
              <img src={user.photoURL} alt="프로필" className="user-photo" />
              <span className="user-name">{user.displayName}</span>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <button className="login-btn" onClick={handleLogin}>
              🔐 구글로 로그인
            </button>
          )}
        </div>
      </header>

      <section className="input-section">
        {user ? (
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="정보를 자유롭게 남겨주세요... (Hãy chia sẻ thông tin...)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
            <button type="submit">글 올리기 (Đăng bài)</button>
          </form>
        ) : (
          <p className="login-notice">✋ 글을 올리려면 먼저 로그인해주세요!</p>
        )}
      </section>

      <section className="post-list">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-user">
                {post.userPhoto && <img src={post.userPhoto} alt="프로필" className="post-photo" />}
                <span className="user">{post.userName}</span>
              </div>
              <span className="date">{post.createdAt?.toDate().toLocaleString() || "작성 중..."}</span>
            </div>
            {editId === post.id ? (
              <div className="edit-area">
                <textarea
                  className="edit-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="edit-btns">
                  <button className="save-btn" onClick={() => handleEditSave(post.id)}>저장</button>
                  <button className="cancel-btn" onClick={() => setEditId(null)}>취소</button>
                </div>
              </div>
            ) : (
              <>
                <p className="post-content">{post.content}</p>
                {user && user.uid === post.uid && (
                  <div className="post-actions">
                    <button className="edit-btn" onClick={() => handleEditStart(post)}>✏️ 수정</button>
                    <button className="delete-btn" onClick={() => handleDelete(post.id)}>🗑️ 삭제</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </section>

      <section className="map-section">
        <h2 className="map-title">📍 접속자 위치 지도</h2>
        <p className="map-sub">글을 올린 분들의 위치예요</p>
        <div className="map-wrap">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 3500, center: [127.5, 36] }}
            width={400}
            height={500}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#ffeaea"
                    stroke="#e53935"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Geographies>
            {markers.map((m, i) => (
              <Marker key={i} coordinates={[m.lng, m.lat]}>
                <circle r={6} fill="#e53935" opacity={0.8} />
              </Marker>
            ))}
          </ComposableMap>
        </div>
        <p className="map-count">총 {markers.length}명의 위치가 표시됐어요</p>
      </section>
    </div>
  );
}

export default App;
