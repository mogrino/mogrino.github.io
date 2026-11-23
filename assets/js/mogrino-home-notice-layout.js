/* MOGRINO - 메인 페이지 OFFICIAL CHANNEL 제거 및 공지 카드 전체 폭 적용.
 * 기존 content.js, Firebase, 관리자/신고/건의 기능을 수정하지 않습니다.
 * v20261123.7
 */
(function () {
  'use strict';

  var path = window.location.pathname;
  if (path !== '/' && path !== '/index.html') return;
  if (window.__mogrinoHomeNoticeLayoutFixV7) return;
  window.__mogrinoHomeNoticeLayoutFixV7 = true;

  function normalize(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function containsMainNotice(node) {
    if (!node || !node.textContent) return false;
    var text = normalize(node.textContent);
    return node.querySelector('a[href*="/news/"]') !== null ||
      text.indexOf('새로운 소식을 준비하고 있습니다') !== -1 ||
      (text.indexOf('견습병') !== -1 && (text.indexOf('출시') !== -1 || text.indexOf('업데이트') !== -1)) ||
      text.indexOf('공지') !== -1;
  }

  function detect(main) {
    var tags = main.querySelectorAll('span, small, p, strong, b, div, h1, h2, h3, h4');
    // 깊은 자손부터 검사: 장식용 자식 요소를 포함한 라벨도 찾습니다.
    for (var i = tags.length - 1; i >= 0; i--) {
      var elem = tags[i];
      if (/^[●•·\s]*OFFICIAL\s+CHANNEL$/i.test(normalize(elem.textContent))) return elem;
    }
    return null;
  }

  function findPair(label, main) {
    // 1차: 문구의 조상 중 '오른쪽 카드 / 왼쪽 공지 카드'가 형제인 행 식별
    for (var right = label; right && right !== main; right = right.parentElement) {
      var row = right.parentElement;
      if (!row || row === main || !main.contains(row)) break;
      var others = Array.from(row.children).filter(function (e) { return e !== right; });
      if (!others.length || others.length > 3) continue;
      var rb = right.getBoundingClientRect();
      // 좌측 공지와 우측 채널 카드가 가로로 나란한 행을 우선 찾습니다.
      var notice = others.find(function (other) {
        var ob = other.getBoundingClientRect();
        var overlapY = Math.min(ob.bottom, rb.bottom) - Math.max(ob.top, rb.top);
        return ob.width >= 150 && rb.width >= 130 &&
          ob.left + 35 < rb.left && overlapY > 24 && containsMainNotice(other);
      });
      if (notice) return { row: row, right: right, notice: notice };
    }
    // 2차: 모바일 세로 배치, 또는 공지 카드에 링크가 없는 구조에도 대응
    for (var card = label; card && card !== main; card = card.parentElement) {
      var parent = card.parentElement;
      if (!parent || parent === main) break;
      var siblings = Array.from(parent.children).filter(function (e) { return e !== card; });
      if (siblings.length !== 1 || !containsMainNotice(siblings[0])) continue;
      var cardText = normalize(card.textContent);
      if (cardText.indexOf('OFFICIAL CHANNEL') === -1 || cardText.length > 700) continue;
      if (card.getBoundingClientRect().width < 110) continue;
      return { row: parent, right: card, notice: siblings[0] };
    }
    // 3차: 시맨틱 aside가 오른쪽 카드인 구조
    var aside = label.closest('aside');
    if (aside && main.contains(aside) && aside.parentElement && aside.parentElement !== main) {
      var row = aside.parentElement;
      var others = Array.from(row.children).filter(function (e) { return e !== aside; });
      if (others.length === 1) return { row: row, right: aside, notice: others[0] };
    }
    return null;
  }

  function apply() {
    var main = document.querySelector('main');
    if (!main) return false;
    var label = detect(main);
    if (!label) return false;
    var found = findPair(label, main);
    if (!found) return false;

    // 기존 오른쪽 안내 카드만 제거합니다.
    found.right.remove();
    var row = found.row;
    var notice = found.notice;
    // 2열/그리드 영역의 잔여 폭 제한을 해제합니다.
    row.style.setProperty('display', 'grid', 'important');
    row.style.setProperty('grid-template-columns', 'minmax(0, 1fr)', 'important');
    row.style.setProperty('grid-template-areas', 'none', 'important');
    row.style.setProperty('width', '100%', 'important');
    row.style.setProperty('max-width', 'none', 'important');
    notice.style.setProperty('grid-column', '1 / -1', 'important');
    notice.style.setProperty('grid-area', 'auto', 'important');
    notice.style.setProperty('width', '100%', 'important');
    notice.style.setProperty('max-width', 'none', 'important');
    notice.style.setProperty('min-width', '0', 'important');
    notice.style.setProperty('box-sizing', 'border-box', 'important');
    row.setAttribute('data-mogrino-home-notice-wide', 'true');
    return true;
  }

  function begin() {
    if (apply()) return;
    // 메인 페이지가 비동기로 렌더링될 때도 10초 동안 다시 시도
    var cycles = 0;
    var timer = setInterval(function () {
      if (apply() || ++cycles >= 40) clearInterval(timer);
    }, 250);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', begin, { once: true });
  } else begin();
})();
