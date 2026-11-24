/* MOGRINO: 공개 업데이트 공지에서 정식 게임 버전 목록 생성 */
export const FIRST_RELEASE = '1.0.22';

export function validVersion(value) {
  return typeof value === 'string' && /^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.test(value);
}

export function compareVersions(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

export function isReleaseVersion(value) {
  return validVersion(value) && compareVersions(value, FIRST_RELEASE) >= 0;
}

export function versionsFromPosts(posts) {
  const versions = new Set([FIRST_RELEASE]);
  for (const post of posts) {
    if (post.status === 'published' && post.category === 'UPDATE' &&
        isReleaseVersion(post.releaseVersion)) {
      versions.add(post.releaseVersion);
    }
  }
  return [...versions].sort((a, b) => compareVersions(b, a));
}

// 기존 공개 공지와 동일한 읽기 조건. 새 컬렉션/새 공개 쓰기 권한 불필요.
export async function loadReleaseVersions() {
  const { configured, db, NEWS_COLLECTION } = await import('./mogrino-news-core.js');
  if (!configured) throw new Error('Firebase not configured');
  const { collection, getDocsFromServer, query, where } = await import('https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js');
  const snap = await getDocsFromServer(query(collection(db, NEWS_COLLECTION), where('status', '==', 'published')));
  return versionsFromPosts(snap.docs.map(d => d.data()));
}
