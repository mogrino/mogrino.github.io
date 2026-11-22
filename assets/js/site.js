(()=>{
'use strict';
const d=window.MOGRINO_CONTENT;
if(!d){console.error('content.js 파일을 불러오지 못했습니다.');return;}
const root=document.body.dataset.root||'./';
const page=document.body.dataset.page||'home';
const $=(sel)=>document.querySelector(sel);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dest=(t,id)=>root+(t==='news'?'news/index.html'+(id?'?id='+encodeURIComponent(id):''):'guide/index.html'+(id?'?topic='+encodeURIComponent(id):''));
const formattedDate=(s)=>s.replaceAll('-','.');
const catName=(s)=>d.categories[s]?.label||s;
const catClass=(s)=>s==='NOTICE'?'':s==='UPDATE'?'blue':s==='EVENT'?'teal':'muted';
const badge=(c)=>`<span class="pill ${catClass(c)}">${esc(catName(c))}</span>`;
const recent=[...d.news].sort((a,b)=>b.date.localeCompare(a.date));
const featured=recent.find(n=>n.pinned)||recent[0];
const articles=recent.filter(n=>n!==featured);

// 공통 설정/메뉴
const privacy=$('[data-privacy]');if(privacy)privacy.href=d.config.privacyUrl;
const status=$('[data-status]');if(status)status.textContent=d.config.status;
const year=$('[data-year]');if(year)year.textContent=String(new Date().getFullYear());
document.querySelectorAll('[data-nav]').forEach(el=>{
 const active=el.dataset.nav===page;
 if(active){el.classList.add('active');el.setAttribute('aria-current','page');}
});
const navToggle=$('[data-nav-toggle]');const nav=$('[data-main-nav]');
function closeNav(){nav?.classList.remove('open');navToggle?.setAttribute('aria-expanded','false')}
navToggle?.addEventListener('click',()=>{
 const yes=nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(yes));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav()});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeNav()});

function renderHome(){
 const f=$('#home-featured');
 if(f&&featured)f.innerHTML=`<a class="featured-news" href="${dest('news',featured.id)}">
   <div class="featured-top">${badge(featured.category)}<span class="date">${formattedDate(featured.date)}</span><span class="pill muted">중요 안내</span></div>
   <div><h3>${esc(featured.title)}</h3><p>${esc(featured.excerpt)}</p><span class="read-more">공지 자세히 보기 ↗</span></div>
 </a>`;
 const list=$('#home-articles');
 if(list) list.innerHTML=articles.length?articles.slice(0,3).map(n=>`<a class="news-card" href="${dest('news',n.id)}"><div><div class="smallrow">${badge(n.category)}<span class="date">${formattedDate(n.date)}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.excerpt)}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`).join(''):
 `<div class="news-card"><div><h3>새로운 소식을 준비하고 있습니다.</h3><p>추가 공지는 NEWS 메뉴에서 확인할 수 있습니다.</p></div></div>`;
 const guide=$('#home-guides');
 if(guide)guide.innerHTML=d.guides.slice(0,4).map(g=>`<a class="guide-card" href="${dest('guide',g.id)}"><div class="guide-no">GUIDE ${esc(g.number)}</div><div class="guide-symbol">${icon(g.icon)}</div><h3>${esc(g.title)}</h3><p>${esc(g.subtitle)}</p></a>`).join('');
}
function icon(i){
 const shapes={compass:'◇',spark:'✦',shield:'♜',star:'✶',map:'⌖',scroll:'▤',cloud:'☁'};
 return shapes[i]||'◇';
}
function renderNews(){
 const id=new URLSearchParams(location.search).get('id');
 const matched=recent.find(x=>x.id===id);
 if(matched){
  $('#news-list-view').hidden=true;$('#news-detail-view').hidden=false;
  document.title=matched.title+' | MOGRINO NEWS';
  const p=$('#news-detail');
  p.innerHTML=`<div class="breadcrumbs"><a href="${root}index.html">HOME</a> / <a href="${root}news/index.html">NEWS</a> / ${esc(matched.title)}</div>
    <div class="article-layout"><article class="article-body"><div class="smallrow">${badge(matched.category)} <span class="date">${formattedDate(matched.date)}</span></div>
    <h1>${esc(matched.title)}</h1><p class="intro-text">${esc(matched.excerpt)}</p>
    ${matched.body.map(block=>`<section><h2>${esc(block.heading)}</h2><p>${esc(block.text)}</p></section>`).join('')}
    <a class="backlink" href="${root}news/index.html">← 전체 소식으로 돌아가기</a></article>
    <aside class="article-aside"><h3>다른 소식</h3>${recent.filter(n=>n!==matched).slice(0,4).map(n=>`<a href="${dest('news',n.id)}">${esc(n.title)} ↗</a>`).join('')}<a href="${root}guide/index.html">게임 가이드 보기 ↗</a></aside></div>`;
  return;
 }
 let current='ALL';
 const filters=$('#news-filters');const list=$('#news-list');const search=$('#news-search');
 const filterData=[['ALL','전체'],...Object.entries(d.categories).map(([k,v])=>[k,v.label])];
 filters.innerHTML=filterData.map(([k,v])=>`<button class="filter ${current===k?'active':''}" data-filter="${esc(k)}" type="button" aria-pressed="${current===k}">${esc(v)}</button>`).join('');
 function update(){
  const q=(search.value||'').trim().toLocaleLowerCase();
  const matches=recent.filter(n=>(current==='ALL'||n.category===current)&&(!q||(n.title+' '+n.excerpt+' '+n.body.map(x=>x.text).join(' ')).toLocaleLowerCase().includes(q)));
  list.innerHTML=matches.length?`<div class="article-list">${matches.map(n=>`<a class="article-row" href="${dest('news',n.id)}"><div><div class="smallrow">${badge(n.category)} <span class="date">${formattedDate(n.date)}</span>${n.pinned?'<span class="date">📌 중요</span>':''}</div><h3>${esc(n.title)}</h3><p>${esc(n.excerpt)}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`:'<div class="empty">해당 조건의 소식이 아직 없습니다.<br>다른 분류를 선택하거나 검색어를 변경해 주세요.</div>';
  $('#news-count').textContent=String(matches.length);
 }
 filters.addEventListener('click',ev=>{
  const btn=ev.target.closest('[data-filter]');if(!btn)return;
  current=btn.dataset.filter;
  filters.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});
  update();
 });
 search.addEventListener('input',update);
 update();
}
function renderGuide(){
 const topic=new URLSearchParams(location.search).get('topic');
 const current=d.guides.find(g=>g.id===topic);
 $('#guide-menu').innerHTML='<div class="menu-title">GAME GUIDE</div>'+d.guides.map(g=>`<a ${g===current?'class="active" aria-current="page"':''} href="${dest('guide',g.id)}"><span class="num">${esc(g.number)}</span> ${esc(g.title)}</a>`).join('');
 const main=$('#guide-main');
 if(current){
  document.title=current.title+' | MOGRINO GAME GUIDE';
  main.innerHTML=`<div class="guide-hero"><img class="guide-hero-media" src="${root}assets/images/${esc(current.image)}" alt="견습병 게임 플레이 화면" loading="eager">
    <div class="guide-hero-body"><span class="date">GAME GUIDE · ${esc(current.number)}</span><h2>${esc(current.title)}</h2><p>${esc(current.lead)}</p></div></div>
    <article class="article-body" style="margin-top:16px">${current.sections.map(s=>`<section><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></section>`).join('')}</article>
    <div class="notice-note">※ 이 가이드는 게임 이용 방법을 소개하는 초기 안내입니다. 세부 수치와 실제 적용 조건은 게임 내 안내 및 향후 공식 패치노트를 우선합니다.</div>
    <a class="backlink" href="${root}guide/index.html">← 모든 가이드 보기</a>`;
 }else{
  main.innerHTML=`<div class="guide-hero"><img class="guide-hero-media" src="${root}assets/images/apprentice-art.webp" alt="견습병 일러스트"><div class="guide-hero-body"><span class="date">START HERE</span><h2>궁금한 시스템부터 찾아보세요.</h2><p>처음 시작하기부터 장비와 제작, 변신, 지역 공략까지. 원하는 항목을 선택하면 자세한 안내를 볼 수 있습니다.</p></div></div>
   <div class="guide-index">${d.guides.map(g=>`<a class="guide-index-card" href="${dest('guide',g.id)}"><span class="num">${esc(g.number)}</span><div><h3>${esc(g.title)} ↗</h3><p>${esc(g.subtitle)}</p></div></a>`).join('')}</div>
   <div class="notice-note">현재 페이지는 게임 가이드 첫 버전입니다. 실제 출시 이후 변경 사항은 NEWS의 패치노트와 함께 업데이트할 예정입니다.</div>`;
 }
}
function renderSupport(){
 const faqs=$('#support-faq');
 if(faqs)faqs.innerHTML=d.faqs.map((x,i)=>`<details class="faq" ${i===0?'open':''}><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('');
 const email=$('#support-email');
 if(email){
  if(d.config.supportEmail){email.href='mailto:'+encodeURIComponent(d.config.supportEmail);email.textContent='이메일로 문의하기 ↗';email.hidden=false;}
  else email.hidden=true;
 }
 const copy=$('#copy-report');const status=$('#copy-result');
 copy?.addEventListener('click',async()=>{
  const msg='[견습병 오류/문의]\n게임 버전: \n기기 모델 / Android 버전: \n발생 시각: \n문제가 발생한 메뉴 / 지역: \n문제 내용: \n재현 방법: \n기타 참고 사항: \n※ 비밀번호, 결제카드 정보 등 민감한 정보는 기재하지 마세요.';
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(msg);}else{const ta=document.createElement('textarea');ta.value=msg;document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw new Error('copy failed');ta.remove()}
   status.textContent='문의 양식을 복사했습니다. 공식 고객지원 채널로 전달할 때 붙여넣으세요.';
  }catch(e){status.textContent='브라우저의 복사 기능이 제한되어 있습니다. 문의 내용을 직접 작성해 주세요.'}
 });
}
if(page==='home')renderHome();
if(page==='news')renderNews();
if(page==='guide')renderGuide();
if(page==='support')renderSupport();
})();
