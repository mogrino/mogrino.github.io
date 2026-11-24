import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import { app, db, configured, NEWS_COLLECTION, CATEGORIES, dateTodayKST, sortPosts, make } from './mogrino-news-core.js';

import { FIRST_RELEASE, isReleaseVersion } from './mogrino-release-versions.js?v=20261124-release1';

const $ = id => document.getElementById(id);
const loginBox = $('login-box');
const dashboard = $('dashboard');
const info = $('admin-message');
const loginMsg = $('login-message');
const form = $('post-form');
const list = $('post-list');
let auth;
let working = false;
let editingId = null;
let posts = [];

function showMessage(el, msg, kind = 'normal') {
  el.textContent = msg;
  el.dataset.kind = kind;
}
function toError(error) {
  const key = String(error?.code || '');
  if (key.includes('invalid-credential') || key.includes('wrong-password') || key.includes('user-not-found')) return '이메일 또는 비밀번호를 확인해 주세요.';
  if (key.includes('too-many-requests')) return '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.';
  if (key.includes('permission-denied')) return '접근 권한이 없습니다. Firestore 규칙의 관리자 UID를 확인하세요.';
  if (key.includes('network-request-failed') || key.includes('unavailable')) return '네트워크 연결을 확인해 주세요.';
  return `오류: ${error?.message || '알 수 없는 오류'}`;
}
function setBusy(isBusy) {
  working = isBusy;
  for (const button of document.querySelectorAll('#dashboard button')) button.disabled = isBusy;
}
function syncReleaseFields() {
  const isUpdate = $('post-category').value === 'UPDATE';
  const enabled = isUpdate && $('post-register-release').checked;
  $('release-fields').hidden = !isUpdate;
  $('post-register-release').disabled = !isUpdate;
  $('post-release-version').disabled = !enabled;
  $('post-release-version').required = enabled;
}
$('post-category').addEventListener('change', syncReleaseFields);
$('post-register-release').addEventListener('change', syncReleaseFields);

function resetEditor() {
  editingId = null;
  form.reset();
  syncReleaseFields();
  $('post-date').value = dateTodayKST();
  $('post-status').value = 'draft';
  $('editor-title').textContent = '새 공지 작성';
  $('save-post').textContent = '새 글 저장';
  $('preview-body').textContent = '';
}
function fillEditor(post) {
  editingId = post.id;
  $('post-title').value = post.title || '';
  $('post-date').value = post.date || dateTodayKST();
  $('post-category').value = CATEGORIES[post.category] ? post.category : 'NOTICE';
  $('post-excerpt').value = post.excerpt || '';
  $('post-body').value = post.body || '';
  $('post-status').value = post.status === 'published' ? 'published' : 'draft';
  $('post-pinned').checked = Boolean(post.pinned);
  $('post-register-release').checked = post.category === 'UPDATE' && isReleaseVersion(post.releaseVersion);
  $('post-release-version').value = post.releaseVersion || '';
  syncReleaseFields();
  $('editor-title').textContent = '공지 수정';
  $('save-post').textContent = '수정 내용 저장';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderList() {
  list.replaceChildren();
  if (!posts.length) {
    list.append(make('p', 'board-muted', '작성된 글이 없습니다. 위에서 첫 공지를 작성하세요.'));
    return;
  }
  for (const post of sortPosts(posts)) {
    const item = make('article', 'admin-list-item');
    const heading = make('div', 'admin-list-item__heading');
    const title = make('strong', '', post.title || '(제목 없음)');
    const meta = make('span', 'board-muted', `${post.date || ''} · ${CATEGORIES[post.category] || '공지'} · ${post.status === 'published' ? '게시 중' : '임시저장'}${post.pinned ? ' · 고정' : ''}${post.category === 'UPDATE' && isReleaseVersion(post.releaseVersion) ? ` · 게임 v${post.releaseVersion}` : ''}`);
    heading.append(title, meta);
    const actions = make('div', 'admin-actions');
    const edit = make('button', 'btn btn-subtle', '수정');
    edit.type = 'button';
    edit.addEventListener('click', () => fillEditor(post));
    actions.append(edit);
    if (post.status === 'published') {
      const open = make('a', 'btn btn-subtle', '게시글 보기 ↗');
      open.href = `/news/?post=${encodeURIComponent(post.id)}`;
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      actions.append(open);
    }
    const remove = make('button', 'btn btn-danger', '삭제');
    remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`「${post.title}」 게시물을 정말 삭제할까요?\n삭제한 게시물은 복구할 수 없습니다.`)) return;
      setBusy(true);
      try {
        await deleteDoc(doc(db, NEWS_COLLECTION, post.id));
        if (editingId === post.id) resetEditor();
        showMessage(info, '게시물을 삭제했습니다.', 'success');
        await reloadPosts();
      } catch (err) { showMessage(info, toError(err), 'error'); }
      finally { setBusy(false); }
    });
    actions.append(remove);
    item.append(heading, actions);
    list.append(item);
  }
}
async function reloadPosts() {
  const snap = await getDocs(collection(db, NEWS_COLLECTION));
  posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderList();
}

// 관리자 권한은 브라우저의 공개 설정값이 아니라 Firestore 보안 규칙에서 확인합니다.
// Firestore 규칙에 등록한 UID만 컬렉션 전체 조회(getDocs)가 허용됩니다.
if (!configured) {
  showMessage(loginMsg, 'Firebase 설정이 비어 있습니다. assets/js/mogrino-firebase-config.js를 확인하세요.', 'error');
  $('login-button').disabled = true;
} else {
  auth = getAuth(app);
  onAuthStateChanged(auth, async user => {
    if (!user) {
      loginBox.hidden = false;
      dashboard.hidden = true;
      return;
    }
    showMessage(loginMsg, '관리자 권한을 확인하고 있습니다…');
    $('login-button').disabled = true;
    try {
      await reloadPosts(); // 관리자만 임시저장 글을 포함한 전체 컬렉션을 읽을 수 있음
      loginBox.hidden = true;
      dashboard.hidden = false;
      $('signed-user').textContent = user.email || user.uid;
      resetEditor();
      showMessage(loginMsg, '');
    } catch (err) {
      loginBox.hidden = false;
      dashboard.hidden = true;
      showMessage(loginMsg, `관리자 권한 확인 실패: ${toError(err)}`, 'error');
      try { await signOut(auth); } catch (ignored) {}
    } finally {
      $('login-button').disabled = false;
    }
  }, err => showMessage(loginMsg, toError(err), 'error'));
}

$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!auth) return;
  $('login-button').disabled = true;
  showMessage(loginMsg, '로그인 중입니다…');
  try {
    await signInWithEmailAndPassword(auth, $('login-email').value.trim(), $('login-password').value);
    $('login-password').value = '';
    showMessage(loginMsg, '');
  } catch (err) { showMessage(loginMsg, toError(err), 'error'); }
  finally { $('login-button').disabled = false; }
});
$('logout-button').addEventListener('click', async () => { if (auth) await signOut(auth); });
$('reset-editor').addEventListener('click', resetEditor);
$('preview-post').addEventListener('click', () => {
  $('preview-title').textContent = $('post-title').value.trim() || '제목 미입력';
  $('preview-body').textContent = $('post-body').value.trim() || '내용 미입력';
  $('preview-panel').hidden = false;
});
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (working || !db) return;
  const payload = {
    title: $('post-title').value.trim(),
    date: $('post-date').value,
    category: $('post-category').value,
    excerpt: $('post-excerpt').value.trim(),
    body: $('post-body').value.trim(),
    pinned: $('post-pinned').checked,
    status: $('post-status').value,
    releaseVersion: $('post-category').value === 'UPDATE' && $('post-register-release').checked
      ? $('post-release-version').value.trim() : ''
  };
  if (!payload.title || !payload.body || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    showMessage(info, '제목·날짜·본문을 확인해 주세요.', 'error'); return;
  }
  if ($('post-category').value === 'UPDATE' && $('post-register-release').checked &&
      !isReleaseVersion(payload.releaseVersion)) {
    showMessage(info, `게임 버전은 ${FIRST_RELEASE} 이상의 숫자 3자리 형식(예: 1.0.23)으로 입력해 주세요.`, 'error');
    $('post-release-version').focus();
    return;
  }
  if (!payload.excerpt) payload.excerpt = payload.body.replace(/\s+/g, ' ').slice(0, 140);
  if (!CATEGORIES[payload.category]) payload.category = 'NOTICE';
  if (!['draft', 'published'].includes(payload.status)) payload.status = 'draft';
  const previous = posts.find(p => p.id === editingId);
  if (payload.status === 'published' && payload.releaseVersion &&
      (previous?.status !== 'published' || previous?.releaseVersion !== payload.releaseVersion ||
       previous?.category !== 'UPDATE')) {
    if (!window.confirm(`게임 v${payload.releaseVersion}을 정식 버전 목록에 등록하고 공지를 공개할까요?\nGoogle Play에서 실제 배포된 버전인지 확인해 주세요.`)) return;
  }
  setBusy(true);
  showMessage(info, '저장 중입니다…');
  try {
    if (editingId) await updateDoc(doc(db, NEWS_COLLECTION, editingId), { ...payload, updatedAt: serverTimestamp() });
    else await addDoc(collection(db, NEWS_COLLECTION), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await reloadPosts();
    resetEditor();
    $('preview-panel').hidden = true;
    showMessage(info, payload.status === 'published' ? '게시되었습니다. 공지사항 메뉴에서 확인할 수 있습니다.' : '임시저장했습니다.', 'success');
  } catch (err) { showMessage(info, toError(err), 'error'); }
  finally { setBusy(false); }
});
