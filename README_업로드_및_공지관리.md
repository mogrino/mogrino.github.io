# MOGRINO 공식 홈페이지 v1 — 업로드 및 운영 안내

## 포함된 기능
- `HOME → NEWS → GAME GUIDE → SUPPORT` 상단 메뉴
- 첫 화면에서 공지 우선 노출, 중요 공지 고정
- NEWS 분류 필터(전체·공지·업데이트·이벤트·개발 소식), 검색, 개별 기사 상세
- GAME GUIDE 7개 주제와 상세 페이지
- SUPPORT FAQ와 오류 신고 양식 복사
- PC·태블릿·휴대전화 대응 반응형 웹
- 자체 회원가입·광고 스크립트·방문자 데이터 수집 없이 정적 호스팅
- 기존 `app-ads.txt` **내용 그대로 포함** / 기존 개인정보처리방침 URL 유지

## 실제 공개하는 방법
1. 포함된 홈페이지 파일을 PC에서 압축 해제합니다.
2. `index.html`을 브라우저에서 열면 로컬로 디자인을 살펴볼 수 있습니다.
3. GitHub의 `mogrino.github.io` 저장소에서 **리포지토리 루트**에 모든 파일과 폴더를 업로드합니다. 압축 상위 폴더 `MOGRINO_공식홈페이지_v1` 자체를 루트에 넣지 말고, 그 **안쪽 파일들**을 업로드합니다.
4. 기존 사이트의 `index.html`을 교체하되 **`app-ads.txt`는 삭제하거나 경로·내용을 바꾸지 마세요.** ZIP에 포함된 같은 원본을 유지하면 됩니다.
5. GitHub Pages 배포 후 `https://mogrino.github.io/`, `/news/`, `/guide/`, `/support/`, `/app-ads.txt`가 열리는지 확인합니다.

## 공지사항 수정 방법 (코딩 거의 불필요)
공지사항, 가이드, FAQ 내용은 모두 `assets/js/content.js`에 모아두었습니다.

- 공지를 추가하려면 `news` 배열 **맨 앞**에 새 게시물 객체를 넣습니다.
- `id`: 공지 고유 주소 값. 게시 후 변경 금지, 영문과 하이픈만 사용 권장.
- `date`: `YYYY-MM-DD` 형식.
- `category`: `NOTICE`(공지), `UPDATE`(업데이트), `EVENT`(이벤트), `DEV`(개발 소식).
- `pinned`: `true`면 홈의 주요 공지 카드 후보입니다. 여러 공지를 고정하면 가장 최신 날짜 하나가 홈 상단 카드로 표시됩니다.
- `title`: 제목. `excerpt`: 목록에 나오는 요약. `body`: `{heading, text}` 단락들의 배열.
- 수정 후 GitHub에 파일을 업로드하면 사이트에 반영됩니다. Unity를 재빌드할 필요는 없습니다.

새 공지 예시 (실제 게시 전 내용 확인):
```js
{
  id: 'update-1-0-1', date: '2026-12-20', category: 'UPDATE', pinned: false,
  title: 'v1.0.1 업데이트 안내', excerpt: '이번 버전에서 개선된 사항을 안내합니다.',
  body: [
    { heading: '개선 사항', text: '실제 업데이트된 내용을 작성합니다.' },
    { heading: '오류 수정', text: '실제 수정된 오류를 작성합니다.' }
  ]
},
```
**샘플 날짜는 예시이며, 실제 게임 배포 이후 확인된 내용으로 바꿔서 게시하세요.**

## 상담 이메일 등록
현재 공식 문의 이메일 주소가 제공되지 않았으므로 임의의 주소를 넣지 않았습니다.
`assets/js/content.js`에서 `config.supportEmail: ''`에 실제 고객지원 이메일 주소를 입력하면 SUPPORT 페이지에 메일 버튼이 나타납니다.

## 현재 홈페이지의 안전한 출시 상태 표시
정식 출시일을 아직 확정하지 않았으므로 `정식 출시 준비 중`으로 표시합니다.
정식 공개 후에는 `config.status`와 첫 번째 고정 공지(`release-preparation`)를 수정하세요.
Google Play 앱 다운로드 주소는 아직 공식 URL이 확인되지 않아 표시하지 않았습니다.

## 파일 구조
```text
index.html
news/index.html
guide/index.html
support/index.html
assets/css/style.css
assets/js/content.js       # 소식/가이드/FAQ/사이트 설정
assets/js/site.js          # 검색·필터·본문 표시 UI
assets/images/            # 실제 견습병 이미지의 웹 최적화 버전
app-ads.txt               # 기존 인증 원본 보존
README_업로드_및_공지관리.md
```

## 참고
- 뉴스와 가이드의 초기 내용은 정식 출시 전 확인된 범위의 일반 안내를 중심으로 작성했습니다.
- 회원 게시판, 클라우드 저장, 문의 접수 서버, 푸시 알림은 구현하지 않았습니다.
- GitHub Pages 자체에서는 정적 파일 공개만 수행합니다.
- 홈페이지에 실제 게임 내 공지 데이터를 연결하려면 향후 Unity에 해당 기능을 별도 구현해야 합니다.
