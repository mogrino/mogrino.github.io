/*
 * MOGRINO / 견습병 홈페이지 건의사항 Formspree 자동 접수
 * 설치 대상: 기존 '건의사항' 페이지의 </body> 직전
 *   <script defer src="/assets/js/mogrino-suggestion-mail.js?v=20261123-1"></script>
 * 기존 버그 신고 JS와는 별개로 동작합니다. 기존 파일은 수정하지 마세요.
 * 사용 중인 Formspree 폼 ID mzerkepj를 함께 사용합니다.
 */
(() => {
  'use strict';

  const FORM_ID = 'mzerkepj';
  const ENDPOINT = `https://formspree.io/f/${FORM_ID}`;
  const SEND_LABEL = '건의하기 ↗';

  function init() {
    // 버그 신고 등 다른 폼을 실수로 변경하지 않도록 구별합니다.
    const heading = document.querySelector('main h1, h1');
    const pageTitle = (heading?.textContent || document.title || '').trim();
    if (/버그\s*신고/.test(pageTitle) && !/건의|제안|의견/.test(pageTitle)) return;

    const allButtons = [...document.querySelectorAll('button, input[type="submit"], input[type="button"]')];
    const targetButton = allButtons.find(el => /작성\s*내용\s*복사|건의\s*하기/.test(
      ((el.tagName === 'INPUT' ? el.value : el.textContent) || '').trim()));
    if (!targetButton) {
      console.warn('[MOGRINO] 건의사항 버튼을 찾을 수 없습니다. 기존 건의사항 HTML을 확인하세요.');
      return;
    }

    const form = targetButton.closest('form') || document.getElementById('feedback-form') ||
      document.querySelector('main form');
    if (!form) {
      console.warn('[MOGRINO] 건의사항 폼을 찾지 못했습니다. 버튼이나 페이지 내용을 수정하지 않았습니다.');
      return;
    }
    if (form.dataset.mogrinoSuggestionConnected === 'true') return;

    const titleInput = form.querySelector(
      'input[name="title"], input[id*="title"], input[name="subject"], input[type="text"]');
    const allTextareas = [...form.querySelectorAll('textarea:not([disabled])')];
    const bodyInput = form.querySelector(
      'textarea[name="body"], textarea[name="detail"], textarea[name="message"], textarea[name="content"], textarea[id*="body"], textarea[id*="detail"], textarea[id*="suggest"]') ||
      allTextareas.at(-1);

    if (!titleInput || !bodyInput) {
      console.warn('[MOGRINO] 건의 제목/내용 입력칸을 식별하지 못했습니다. 원본 파일을 확인해야 합니다.');
      return;
    }
    form.dataset.mogrinoSuggestionConnected = 'true';
    if (targetButton.tagName === 'INPUT') targetButton.value = SEND_LABEL;
    else targetButton.textContent = SEND_LABEL;
    targetButton.setAttribute('aria-label', '건의사항 MOGRINO에 전송');

    const existingMessage = document.getElementById('feedback-message');
    // 안내 요소가 있으면 그 자리에서 응답을 보여 주고 기존 페이지 배치는 유지합니다.
    const status = existingMessage || document.createElement('p');
    if (!existingMessage) {
      status.id = 'mogrino-suggestion-message';
      status.style.cssText = 'margin:12px 0 0;line-height:1.7;white-space:pre-line;';
      targetButton.insertAdjacentElement('afterend', status);
    }
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = '건의하기 버튼을 누르면 작성 내용이 MOGRINO에 전송됩니다.';

    // '복사 기능만 지원, 전송 불가'라는 기존 잘못된 안내 문구를 갱신합니다.
    const box = form.closest('.feedback-panel') || form.parentElement;
    if (box) {
      const textNodes = [];
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        if (node.parentElement?.closest('script, style, textarea, button, select, option')) continue;
        const original = node.nodeValue;
        let modified = original
          .replace(/작성한 내용을 복사하여 이용할 수 있습니다\.?\s*현재 홈페이지에서 서버로 직접 접수되지는 않습니다\.?/g,
                   '건의하기를 누르면 작성 내용이 MOGRINO에 전송됩니다.')
          .replace(/작성한 내용은 이 화면에서 자동 전송되지 않습니다\.?\s*공식 문의 채널은 준비 중입니다\.?/g,
                   '건의하기를 누르면 작성 내용이 MOGRINO에 전송됩니다.')
          .replace(/내용 복사는 실제 접수가 아닙니다\.?\s*접수 채널 연결 전까지 자동 전송되지 않습니다\.?/g,
                   '건의하기를 누르면 건의사항이 접수됩니다.');
        if (modified !== original) node.nodeValue = modified;
      }
    }

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = '건의 내용 복사';
    copyButton.style.cssText = 'display:none;margin:10px 0 0;padding:8px 12px;border:1px solid #61738d;border-radius:8px;background:transparent;color:inherit;cursor:pointer;';
    status.insertAdjacentElement('afterend', copyButton);

    function setStatus(message, type) {
      status.textContent = message;
      status.style.whiteSpace = 'pre-line';
      status.style.color = type === 'success' ? '#7de5b2' : type === 'error' ? '#ffb69e' : '#f0c87e';
    }
    function setBusy(value) {
      targetButton.disabled = value;
      targetButton.setAttribute('aria-busy', String(value));
      const label = value ? '전송 중...' : SEND_LABEL;
      if (targetButton.tagName === 'INPUT') targetButton.value = label;
      else targetButton.textContent = label;
    }
    function labelFor(el) {
      const matchingLabel = el.id ? [...form.querySelectorAll('label')].find(x => x.htmlFor === el.id) : null;
      const text = matchingLabel?.textContent || el.closest('label')?.textContent ||
        el.getAttribute('aria-label') || el.name || el.id || '기타';
      return text.replace(/\s*(필수|선택|\*)\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || '기타';
    }
    function collect() {
      const fields = [...form.querySelectorAll('input, textarea, select')];
      const details = [];
      for (const el of fields) {
        if (el.disabled || ['hidden','submit','button','reset','file','password'].includes(el.type)) continue;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
        const value = String(el.value || '').trim();
        if (!value) continue;
        const name = el.name || el.id || 'field';
        if (name.startsWith('_')) continue;
        details.push({ key: name, label: labelFor(el), value });
      }
      return {
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        details
      };
    }
    function asMessage(d) {
      const lines = ['[MOGRINO - 견습병 건의사항]', '', '■ 제목', d.title, ''];
      for (const f of d.details) {
        if (f.value === d.title) continue;
        lines.push(`■ ${f.label}`, f.value, '');
      }
      if (!d.details.some(f => f.value === d.body)) lines.push('■ 상세 내용', d.body, '');
      lines.push('-----------------------------', 'MOGRINO PLAYER FEEDBACK');
      return lines.join('\n');
    }

    let isSending = false;
    let lastSent = '';
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(asMessage(collect()));
        setStatus('건의 내용을 복사했습니다. 이메일 전송은 완료되지 않았습니다.', 'info');
      } catch {
        setStatus('복사에 실패했습니다. 입력창에서 내용을 직접 복사해 주세요.', 'error');
      }
    });

    async function sendSuggestion() {
      if (isSending) return;
      copyButton.style.display = 'none';
      // 페이지 자체의 필수 입력/이메일 형식 검사를 존중합니다.
      if (!form.reportValidity()) return;
      const d = collect();
      if (!d.title || !d.body) {
        setStatus('제목과 상세 내용을 입력해 주세요.', 'error');
        (!d.title ? titleInput : bodyInput).focus();
        return;
      }
      if (d.title.length > 150 || d.body.length > 10000) {
        setStatus('제목은 150자, 상세 내용은 10,000자 이내로 작성해 주세요.', 'error');
        return;
      }
      const signature = JSON.stringify(d);
      if (signature === lastSent) {
        setStatus('같은 건의사항이 이미 접수되었습니다.', 'success');
        return;
      }

      const data = new FormData();
      data.append('_subject', `[견습병 건의사항] ${d.title}`);
      data.append('신고유형', '견습병 건의사항');
      data.append('제목', d.title);
      d.details.forEach((f, i) => {
        if (f.value === d.title) return;
        data.append(`항목${i + 1}_${f.key}`.slice(0, 80), f.value);
      });
      data.append('상세내용', d.body);
      data.append('message', asMessage(d));

      isSending = true;
      setBusy(true);
      setStatus('건의사항을 전송하고 있습니다...', 'info');
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) {
          if (response.status === 429) throw new Error('전송 요청이 많습니다. 잠시 후 다시 시도해 주세요.');
          if ([400, 422].includes(response.status)) throw new Error('입력값 또는 접수 설정을 확인해 주세요.');
          throw new Error(`서버 응답 ${response.status}`);
        }
        lastSent = signature;
        setStatus('✓ 건의사항이 정상적으로 접수되었습니다.\n소중한 의견 감사합니다.', 'success');
      } catch (err) {
        setStatus(`전송에 실패했습니다. 입력 내용은 그대로 보존됩니다.\n${err.message || '인터넷 연결을 확인하고 다시 시도해 주세요.'}`, 'error');
        copyButton.style.display = 'inline-block';
      } finally {
        isSending = false;
        setBusy(false);
      }
    }

    // 기존 '내용 복사' 핸들러에 전송이 가로막히거나 중복 호출되지 않도록 합니다.
    targetButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void sendSuggestion();
    }, true);
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void sendSuggestion();
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
