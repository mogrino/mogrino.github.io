/*
 * 공지 페이지 /news/: Firebase 공지를 목록 및 상세 페이지에 표시합니다.
 * 홈페이지 /: 기존 최신 소식 카드가 있으면 해당 카드만 업데이트하고, 없으면 최신 3개를 표시합니다.
 * Firebase 설정/네트워크 오류 시 기존 홈페이지 내용을 그대로 유지합니다.
 * 보안: 본문은 HTML로 삽입하지 않고 textContent로만 표시합니다.
 */
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import { configured, db, NEWS_COLLECTION, CATEGORIES, sortPosts, make } from './mogrino-news-core.js';

const path = location.pathname.replace(/index\.html$/i, '');
const isNews = /\/news\/?$/.test(path);
const isHome = path === '/' || path === '';
if (configured && (isNews || isHome)) {
  start().catch(err => console.warn('[MOGRINO 공지 게시판] 목록을 불러오지 못했습니다. 기존 페이지를 유지합니다.', err));
}

async function start() {
  // 게시 중인 문서만 요청해야 Firestore 공개 읽기 규칙을 충족합니다.
  const snap = await getDocs(query(collection(db, NEWS_COLLECTION), where('status', '==', 'published')));
  const posts = sortPosts(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
  const main = document.querySelector('main');
  if (!main) return;
  if (isNews) {
    const requestedId = new URL(location.href).searchParams.get('post');
    const board = requestedId ? renderDetail(posts, requestedId) : renderNews(posts);
    // 기존 공지 HTML/JS를 건드리지 않고 main 내부만 교체합니다.
    main.replaceChildren(board);
  } else if (isHome && posts.length) {
    // 기존 메인의 '새로운 소식을 준비하고 있습니다' 안내 카드를 우선 교체합니다.
    // 그 카드가 없는 다른 버전의 홈페이지라면 최신 공지 패널을 추가합니다.
    if (!updateHomeNewsCard(main, posts[0])) {
      main.prepend(renderHome(posts.slice(0, 3)));
    }
  }
}

function plainExcerpt(value) {
  // 관리자 본문에서 자동 생성된 요약에 포함된 간단한 마크다운 강조 기호를 제거합니다.
  return String(value || '').replace(/\*\*|__|`/g, '').replace(/(^|\s)#+\s*/g, '$1').replace(/\s+/g, ' ').trim();
}

function updateHomeNewsCard(main, post) {
  const leafs = Array.from(main.querySelectorAll('h1,h2,h3,h4,h5,h6,p,strong,b,span,a,div'))
    .filter(el => el.childElementCount === 0);
  const heading = leafs.find(el => el.textContent.trim().includes('새로운 소식을 준비하고 있습니다'));
  if (!heading) return false;

  const href = `/news/?post=${encodeURIComponent(post.id)}`;
  if (heading.tagName === 'A') {
    heading.href = href;
    heading.textContent = post.title || '최신 공지 보기';
  } else {
    const link = make('a', '', post.title || '최신 공지 보기');
    link.href = href;
    link.style.color = 'inherit';
    link.style.textDecoration = 'none';
    heading.replaceChildren(link);
  }
  const summary = leafs.find(el => el !== heading &&
    el.textContent.trim().includes('추가 공지는 공지사항 메뉴에서 확인할 수 있습니다'));
  if (summary) {
    const description = plainExcerpt(post.excerpt || post.body || '').slice(0, 170);
    summary.textContent = description || '공지사항에서 상세 내용을 확인하세요.';
  }
  return true;
}
function wrap(title, subtitle) {
  const section = make('section', 'mogrino-board');
  const kicker = make('p', 'mogrino-board__kicker', 'MOGRINO · OFFICIAL NEWS');
  section.append(kicker, make('h1', 'mogrino-board__title', title));
  if (subtitle) section.append(make('p', 'mogrino-board__intro', subtitle));
  return section;
}
function renderCard(post) {
  const item = make('article', 'mogrino-board__item');
  const meta = make('div', 'mogrino-board__meta');
  if (post.pinned) meta.append(make('span', 'mogrino-board__pin', '중요'));
  meta.append(make('span', '', CATEGORIES[post.category] || '공지'));
  meta.append(make('time', '', post.date || ''));
  const link = make('a', 'mogrino-board__link', post.title || '(제목 없음)');
  link.href = `/news/?post=${encodeURIComponent(post.id)}`;
  item.append(meta, link);
  if (post.excerpt) item.append(make('p', 'mogrino-board__excerpt', plainExcerpt(post.excerpt)));
  return item;
}
function renderNews(posts) {
  const section = wrap('공지사항', '《견습병》의 공지 · 업데이트 · 이벤트 · 개발 소식을 확인하세요.');
  const list = make('div', 'mogrino-board__list');
  if (!posts.length) list.append(make('p', 'mogrino-board__empty', '현재 등록된 공지사항이 없습니다.'));
  else posts.forEach(post => list.append(renderCard(post)));
  section.append(list);
  return section;
}
function renderDetail(posts, id) {
  const post = posts.find(p => p.id === id);
  if (!post) {
    const section = wrap('공지를 찾을 수 없습니다', '삭제되었거나 비공개로 변경된 게시물입니다.');
    const back = make('a', 'mogrino-board__return', '← 공지 목록');
    back.href = '/news/'; section.append(back); return section;
  }
  const section = wrap(post.title, '');
  const meta = make('div', 'mogrino-board__meta');
  if (post.pinned) meta.append(make('span', 'mogrino-board__pin', '중요'));
  meta.append(make('span', '', CATEGORIES[post.category] || '공지'));
  meta.append(make('time', '', post.date || ''));
  const article = make('article', 'mogrino-board__body', post.body || '');
  const back = make('a', 'mogrino-board__return', '← 공지 목록으로');
  back.href = '/news/';
  section.append(meta, article, back);
  document.title = `${post.title} | MOGRINO`;
  return section;
}
function renderHome(posts) {
  const section = wrap('최신 공지', 'MOGRINO 공식 최신 소식');
  section.classList.add('mogrino-board--home');
  const list = make('div', 'mogrino-board__list');
  posts.forEach(post => list.append(renderCard(post)));
  const more = make('a', 'mogrino-board__return', '공지사항 전체 보기 →');
  more.href = '/news/';
  section.append(list, more);
  return section;
}
