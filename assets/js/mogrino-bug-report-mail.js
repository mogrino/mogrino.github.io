/*
 * MOGRINO / 견습병 홈페이지 버그 신고 Formspree 연결 (버튼 표시 수정 v2)
 * 설치: /bug/index.html의 </body> 직전에 아래 스크립트를 추가합니다.
 *   <script defer src="/assets/js/mogrino-bug-report-mail.js"></script>
 * Formspree에서 발급된 mzerkepj ID가 이미 설정된 파일입니다. ID를 바꿀 필요 없습니다.
 * 주의: 사용자의 이메일 비밀번호/API 비밀키를 이 파일에 넣지 마세요.
 */
(() => {
  'use strict';

  // MOGRINO 버그 신고 폼의 공개 전송 ID. 관리자 비밀키가 아닙니다.
  const FORM_ID = 'mzerkepj';

  const currentPage = location.pathname.replace(/\/index\.html$/i, '/');
  if (!/(^|\/)bug\/?$/i.test(currentPage)) return;

  const isReady = /^[a-zA-Z0-9]{6,24}$/.test(FORM_ID) && FORM_ID !== 'YOUR_FORM_ID';
  if (!isReady) {
    console.warn('[MOGRINO] Formspree Form ID가 설정되지 않았습니다. 기존 복사 동작을 유지합니다.');
    return;
  }

  function boot() {
    const buttons = [...document.querySelectorAll('button, input[type="button"], input[type="submit"], a')];
    const sendButton = buttons.find(el => /작성\s*내용\s*복사|버그\s*신고하기/.test((el.textContent || el.value || '').trim()));
    if (!sendButton) {
      console.warn('[MOGRINO] 버그 신고 버튼을 찾지 못했습니다. 기존 사이트 소스를 확인하세요.');
      return;
    }

    // 기존 디자인과 배치를 변경하지 않고 입력칸을 찾습니다.
    const fields = [...document.querySelectorAll('input, textarea')]
      .filter(el => el.type !== 'hidden' && el.type !== 'checkbox' && !el.disabled);
    const find = (tag, hints) => fields.find(el =>
      el.tagName.toLowerCase() === tag && hints.some(h =>
        `${el.placeholder || ''} ${el.id || ''} ${el.name || ''}`.includes(h)));
    const inputs = fields.filter(el => el.tagName.toLowerCase() === 'input' &&
      !['submit','button','radio','file'].includes(el.type));
    const areas = fields.filter(el => el.tagName.toLowerCase() === 'textarea');

    const titleField = find('input', ['어떤 오류가 발생했나요', 'bugTitle', 'bug-title', 'errorTitle']) || inputs[0];
    const versionField = find('input', ['1.0.19', 'gameVersion', 'game-version']) || inputs[1];
    const deviceField = find('input', ['Galaxy S24', 'deviceModel', 'device-model']) || inputs[2];
    const stepsField = find('textarea', ['장비 창 열기', '오류 발생 순서', 'steps', 'sequence']) || areas[0];
    const detailField = find('textarea', ['실제 발생한 현상', '상세 내용', 'detail', 'description']) || areas[1];

    if (![titleField, versionField, deviceField, stepsField, detailField].every(Boolean) ||
        new Set([titleField, versionField, deviceField, stepsField, detailField]).size !== 5) {
      console.warn('[MOGRINO] 버그 신고 입력칸 매핑 실패. 오접수를 막기 위해 전송 기능을 활성화하지 않습니다.');
      return;
    }

    // HTML 속성 값/label이나 다른 페이지 구조는 건드리지 않습니다.
    if (sendButton.tagName === 'INPUT') sendButton.value = '버그 신고하기 ↗';
    else sendButton.textContent = '버그 신고하기 ↗';
    sendButton.setAttribute('aria-label', '작성한 버그 신고 내용 이메일 접수');
    titleField.required = true;
    detailField.required = true;
    titleField.maxLength = titleField.maxLength > 0 ? Math.min(titleField.maxLength, 150) : 150;

    if (document.getElementById('mogrino-bug-submit-status')) return;

    const status = document.createElement('div');
    status.id = 'mogrino-bug-submit-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin:14px 0 0;line-height:1.7;font-size:14px;display:none;white-space:pre-line;';
    sendButton.insertAdjacentElement('afterend', status);

    const copyFallback = document.createElement('button');
    copyFallback.type = 'button';
    copyFallback.textContent = '신고 내용 복사';
    copyFallback.style.cssText = 'display:none;margin:10px 0 0;padding:8px 12px;border:1px solid #61738d;border-radius:8px;background:transparent;color:inherit;cursor:pointer;';
    status.insertAdjacentElement('afterend', copyFallback);

    // 기존의 '복사만 가능/자동 전송 불가' 안내는 더는 정확하지 않으므로 갱신합니다.
    const notes = [
      [/작성한 내용은 이 화면에서 자동 전송되지 않습니다\.\s*공식 문의 채널은 준비 중입니다\.?/g,
       '버그 신고하기를 누르면 작성 내용이 MOGRINO에 전송됩니다. 전송 완료 안내를 확인해 주세요.'],
      [/내용 복사는 실제 접수가 아닙니다\.\s*접수 채널 연결 전까지 자동 전송되지 않습니다\.?/g,
       '버그 신고하기를 누르면 신고가 전송됩니다. 접수 완료 표시를 확인해 주세요.'],
      [/작성한 내용을 복사하여 이용할 수 있습니다\.\s*현재 홈페이지에서 서버로 직접 접수되지는 않습니다\.?/g,
       '내용을 작성한 뒤 버그 신고하기를 누르면 이메일 접수 서비스로 전달됩니다.']
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      if (node.parentElement?.closest('script,style,textarea')) continue;
      let updated = node.nodeValue;
      for (const [from, to] of notes) updated = updated.replace(from, to);
      if (updated !== node.nodeValue) node.nodeValue = updated;
    }

    const getPayload = () => ({
      title: titleField.value.trim(),
      version: versionField.value.trim(),
      device: deviceField.value.trim(),
      steps: stepsField.value.trim(),
      detail: detailField.value.trim()
    });
    const formatMessage = d => [
      '[MOGRINO - 견습병 버그 신고]', '',
      '■ 제목', d.title, '',
      '■ 게임 버전', d.version || '미입력', '',
      '■ 기기 모델', d.device || '미입력', '',
      '■ 오류 발생 순서', d.steps || '미입력', '',
      '■ 상세 내용', d.detail, '',
      '-----------------------------',
      'MOGRINO PLAYER FEEDBACK'
    ].join('\n');

    function show(message, type) {
      status.textContent = message;
      status.style.color = type === 'success' ? '#7de5b2' : type === 'error' ? '#ffb69e' : '#f0c87e';
      status.style.display = 'block';
    }
    function setBusy(busy) {
      sendButton.disabled = busy;
      sendButton.setAttribute('aria-busy', String(busy));
      if (sendButton.tagName === 'INPUT') sendButton.value = busy ? '전송 중...' : '버그 신고하기 ↗';
      else sendButton.textContent = busy ? '전송 중...' : '버그 신고하기 ↗';
    }

    let sending = false;
    let sentFingerprint = '';
    copyFallback.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(formatMessage(getPayload()));
        show('신고 내용을 복사했습니다. 전송은 완료되지 않았습니다.', 'info');
      } catch {
        show('자동 복사가 차단됐습니다. 입력 내용을 직접 복사해 주세요.', 'error');
      }
    });

    async function submitReport() {
      if (sending) return;
      const d = getPayload();
      copyFallback.style.display = 'none';
      if (!d.title || !d.detail) {
        show('제목과 상세 내용은 필수입니다.', 'error');
        (!d.title ? titleField : detailField).focus();
        return;
      }
      if (d.title.length > 150 || d.detail.length > 10000 || d.steps.length > 5000) {
        show('글이 너무 깁니다. 제목 150자, 상세 내용 10,000자 이내로 줄여 주세요.', 'error');
        return;
      }
      const fingerprint = JSON.stringify(d);
      if (fingerprint === sentFingerprint) {
        show('같은 내용은 이미 접수되었습니다. 다시 전송할 필요가 없습니다.', 'success');
        return;
      }

      sending = true;
      setBusy(true);
      show('버그 신고를 전송하고 있습니다...', 'info');
      const form = new FormData();
      form.append('_subject', `[견습병 버그 신고] ${d.title}`);
      form.append('신고유형', '견습병 버그 신고');
      form.append('제목', d.title);
      form.append('게임버전', d.version || '미입력');
      form.append('기기모델', d.device || '미입력');
      form.append('오류발생순서', d.steps || '미입력');
      form.append('상세내용', d.detail);
      form.append('message', formatMessage(d));

      try {
        const res = await fetch(`https://formspree.io/f/${FORM_ID}`, {
          method: 'POST',
          body: form,
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) {
          if (res.status === 429) throw new Error('요청이 많아 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.');
          if (res.status === 422 || res.status === 400) throw new Error('입력값을 확인해 주세요.');
          throw new Error(`서버 응답 ${res.status}. 잠시 후 다시 시도해 주세요.`);
        }
        sentFingerprint = fingerprint;
        show('✓ 버그 신고가 접수 서비스에 정상 전달되었습니다.\nMOGRINO에 제보해 주셔서 감사합니다.', 'success');
        // 전송 완료 후 사용자가 내용을 확인할 수 있도록 입력칸은 유지합니다.
      } catch (error) {
        show(`전송하지 못했습니다. 입력 내용은 유지됩니다.\n${error.message || '인터넷 연결을 확인하고 다시 시도해 주세요.'}`, 'error');
        copyFallback.style.display = 'inline-block';
      } finally {
        sending = false;
        setBusy(false);
      }
    }

    // 기존 복사 클릭 핸들러보다 앞에서 이벤트를 잡아 이중 처리/클립보드 복사를 막습니다.
    sendButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void submitReport();
    }, true);

    // 기존 폼에 submit 핸들러가 있어도 새 전송만 실행합니다.
    const existingForm = sendButton.closest('form');
    if (existingForm) {
      existingForm.addEventListener('submit', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        void submitReport();
      }, true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
