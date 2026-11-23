/* MOGRINO 게시판 Firebase 공통 연결 (웹 모듈 CDN 방식, 빌드 도구 불필요) */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

export const NEWS_COLLECTION = 'mogrino_news';
export const CATEGORIES = Object.freeze({
  NOTICE: '공지', UPDATE: '업데이트', EVENT: '이벤트', DEV: '개발 소식'
});
export const settings = window.MOGRINO_FIREBASE || {};
const cfg = settings.firebaseConfig || {};
export const configured = Boolean(
  cfg.apiKey && !cfg.apiKey.includes('PASTE_') &&
  cfg.projectId && !cfg.projectId.includes('PASTE_') &&
  cfg.authDomain && !cfg.authDomain.includes('PASTE_') &&
  cfg.appId && !cfg.appId.includes('PASTE_')
);
export const app = configured ? initializeApp(cfg, 'mogrino-news-board') : null;
export const db = configured ? getFirestore(app) : null;

export function dateTodayKST() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

export function sortPosts(items) {
  return [...items].sort((a, b) =>
    Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
    String(b.date || '').localeCompare(String(a.date || '')) ||
    String(b.id || '').localeCompare(String(a.id || ''))
  );
}

export function make(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}
