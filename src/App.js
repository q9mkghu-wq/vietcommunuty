import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import './App.css';

const GEO_URL = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo.json';

function App() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [userIp, setUserIp] = useState("IP 불러오는 중...");
  const [userCoords, setUserCoords] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const parts = data.ip.split('.');
        const maskedIp = `${parts[0]}.${parts[1]}.***.***`;
        setUserIp(maskedIp);
        if (data.latitude && data.longitude) {
          setUserCoords({ lat: data.latitude, lng: data.longitude });
        }
      })
      .catch(() => setUserIp("Unknown IP"));

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
      const coords = data
        .filter(p => p.lat && p.lng)
        .map(p => ({ lat: p.lat, lng: p.lng, name: p.userName }));
      setMarkers(coords);
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
        lat: userCoords?.lat || null,
        lng: userCoords?.lng || null,
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

      {/* 지도 섹션 */}
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
