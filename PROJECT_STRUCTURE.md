# Shop-Custom 프로젝트 구조 분석

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | **Nuxt 4.2.2** (Vue 3.5.26) |
| 언어 | TypeScript |
| 상태관리 | Pinia + Nuxt useState |
| 스타일링 | SCSS (토큰 기반 디자인 시스템) |
| 패키지 매니저 | pnpm |
| 배포 | AWS Amplify (SSR) |
| 결제 | Toss Payments |
| 소셜 로그인 | Naver, Google OAuth |
| 백엔드 API | REST API (`api-user.sigdec.click/api/v1`) |

---

## 디렉토리 구조

```
shop-custom/
├── app/
│   ├── assets/
│   │   ├── icons/                     # SVG 아이콘 (arrow.svg, review.svg)
│   │   ├── images/                    # 로컬 이미지 (인스타그램, 에러 페이지)
│   │   └── styles/                    # SCSS 스타일시트 시스템
│   │       ├── tokens/                #   디자인 토큰 (colors, spacing, typography, breakpoints)
│   │       ├── base/                  #   기본 스타일 (reset, typography)
│   │       ├── layout/                #   레이아웃 스타일
│   │       ├── pages/                 #   페이지별 스타일
│   │       ├── components/            #   컴포넌트별 스타일 (89+ 파일)
│   │       └── main.scss              #   글로벌 진입점
│   │
│   ├── components/
│   │   ├── ui/                        # 재사용 UI 컴포넌트 (25+ 파일)
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseInput.vue
│   │   │   ├── BaseModal.vue
│   │   │   ├── BaseRadio.vue
│   │   │   ├── BaseTabs.vue
│   │   │   ├── BaseToast.vue
│   │   │   └── ...
│   │   ├── layout/                    # 레이아웃 컴포넌트
│   │   │   ├── Header.vue
│   │   │   ├── Footer.vue
│   │   │   ├── LayoutPage.vue
│   │   │   └── LayoutProductList.vue
│   │   └── domain/                    # 도메인 컴포넌트 (50+ 파일)
│   │       ├── Product*.vue           #   상품 관련
│   │       ├── Order*.vue             #   주문 관련
│   │       ├── MyPage*.vue            #   마이페이지 관련
│   │       ├── Cart*.vue              #   장바구니 관련
│   │       └── ...
│   │
│   ├── composables/                   # Vue 3 Composables (27개, ~4,685 LOC)
│   │   ├── useApi.js                  #   API 호출 (토큰 갱신, 에러 처리, SSR)
│   │   ├── useProducts.js             #   상품 목록 조회
│   │   ├── useProductDetail.js        #   상품 상세 조회
│   │   ├── useCart.js                 #   장바구니
│   │   ├── useOrder.js               #   주문
│   │   ├── useShopInfo.js            #   쇼핑몰 정보 (브랜딩, SEO, 메뉴)
│   │   ├── useNavigation.js          #   네비게이션
│   │   ├── useTheme.js               #   테마 전환
│   │   ├── useSocialAuth.js          #   소셜 로그인
│   │   ├── useCoupons.js             #   쿠폰
│   │   ├── useReviews.js             #   리뷰
│   │   ├── useAddress.js             #   주소 관리
│   │   ├── usePopup.js               #   팝업/모달
│   │   └── ...
│   │
│   ├── data/                          # JSON 데이터 파일 (29개)
│   │   ├── main.json                  #   메인 페이지 텍스트
│   │   ├── product-detail.json        #   상품 상세 텍스트
│   │   ├── order.json                 #   주문 페이지 텍스트
│   │   ├── signup.json                #   회원가입 텍스트
│   │   └── ...                        #   (다국어 대응 가능 구조)
│   │
│   ├── layouts/                       # Nuxt 레이아웃
│   │   ├── default.vue                #   기본 레이아웃
│   │   └── mypage.vue                 #   마이페이지 레이아웃
│   │
│   ├── middleware/                     # 라우트 미들웨어
│   │   └── auth.js                    #   인증 보호
│   │
│   ├── pages/                         # 파일 기반 라우팅
│   │   ├── index.vue                  #   홈 (히어로, 카테고리, 베스트 상품, 배너)
│   │   ├── products/
│   │   │   └── [id].vue               #   상품 상세 (리뷰, Q&A 탭)
│   │   ├── cart.vue                   #   장바구니
│   │   ├── order.vue                  #   주문/결제
│   │   ├── payment/
│   │   │   ├── success.vue            #   결제 성공
│   │   │   └── fail.vue               #   결제 실패
│   │   ├── mypage/                    #   마이페이지
│   │   │   ├── index.vue              #     대시보드
│   │   │   ├── orders.vue             #     주문 내역
│   │   │   ├── address.vue            #     배송지 관리
│   │   │   ├── coupons.vue            #     쿠폰함
│   │   │   ├── wishlist.vue           #     찜 목록
│   │   │   └── reviews.vue            #     리뷰 관리
│   │   ├── auth/
│   │   │   └── callback/[provider].vue #  OAuth 콜백
│   │   ├── signup/                    #   회원가입 (다단계)
│   │   ├── notice/                    #   공지사항
│   │   ├── review/                    #   리뷰
│   │   ├── qna/                       #   Q&A
│   │   ├── faq/                       #   FAQ
│   │   └── support/                   #   고객지원
│   │
│   ├── plugins/                       # Nuxt 플러그인
│   │   ├── auth.server.js             #   서버 인증 초기화
│   │   └── cart.client.js             #   클라이언트 장바구니 초기화
│   │
│   ├── stores/                        # Pinia 스토어
│   │   ├── auth.js                    #   인증 상태 (로그인, 토큰, 세션 만료)
│   │   └── signup.js                  #   회원가입 흐름 (단계, 폼 데이터, 약관 동의)
│   │
│   ├── utils/                         # 유틸리티 함수
│   │
│   └── app.vue                        # 루트 컴포넌트
│
├── public/
│   └── images/                        # 정적 에셋 (배너, 상품, 에러)
│
├── server/
│   ├── api/
│   │   └── [...].js                   #   API 프록시 (모든 /api/* 요청)
│   └── routes/                        #   서버 사이드 라우트
│
├── nuxt.config.ts                     # Nuxt 설정
├── package.json                       # 의존성 & 스크립트
├── tsconfig.json                      # TypeScript 설정
├── .env                               # 환경 변수
└── pnpm-lock.yaml                     # 의존성 락 파일
```

---

## 컴포넌트 계층 구조 (3단계)

```
ui/ (Presentational)          → 순수 UI 컴포넌트, 비즈니스 로직 없음
  ↑
layout/ (Structural)          → 페이지 레이아웃 구성
  ↑
domain/ (Business Logic)      → 도메인별 비즈니스 컴포넌트
```

---

## 스타일링 시스템

### 디자인 토큰 기반 SCSS

| 토큰 | 역할 |
|------|------|
| `breakpoints` | 반응형 (xs:320, sm:640, md:768, lg:1024, xl:1280, xxl:1536) |
| `colors` | 동적 테마 (Green, Brown, Blue, Gray 팔레트) |
| `spacing` | 간격 체계 |
| `typography` | 타이포그래피 (Pretendard 폰트) |
| `icons` | 아이콘 토큰 |
| `layout` | 레이아웃 토큰 |

- CSS 변수(`--theme-primary-*`)로 런타임 테마 전환 지원
- 컴포넌트별 Scoped SCSS (89+ 파일)
- BEM 네이밍 패턴 (`component-name__element`)

---

## 인증 흐름

```
로그인 → access_token + refresh_token (쿠키 저장)
    ↓
API 요청 시 쿠키 자동 전송
    ↓
401 + AUTH_016 → /auth/refresh 토큰 갱신
    ↓
갱신 실패 (AUTH_002) → 세션 만료 모달 표시
```

- SSR: `auth.server.js` 플러그인이 서버에서 인증 상태 초기화
- 게스트: `x-session-id` 쿠키로 비로그인 세션 관리
- Safari 호환: 서버 프록시에서 `Set-Cookie` 헤더 수정 (Secure 제거, SameSite=Lax)

---

## API 프록시 구조

```
클라이언트 → /api/*  →  server/api/[...].js  →  api-user.sigdec.click/api/v1/*
                         (쿠키 헤더 변환)
```

- 모든 API 요청을 서버 프록시로 중계
- Safari 쿠키 이슈 해결 목적
- `Set-Cookie` 헤더의 `Secure`, `SameSite` 속성 조정

---

## 주요 기능

### 쇼핑
- 상품 목록 (카테고리, 태그, 검색, 페이지네이션)
- 상품 상세 (리뷰/Q&A 탭)
- 장바구니 (추가/삭제/수량 변경)
- 다단계 주문 (배송지/결제 정보)
- 주문 내역 & 배송 추적
- 비회원 주문 조회

### 사용자 관리
- 소셜 로그인 (Naver, Google)
- 이메일 회원가입 (다단계)
- 프로필 & 배송지 관리
- 찜 목록
- 회원 등급 (Family, Silver, Gold, VIP)

### 콘텐츠
- 배너 관리 (히어로, 풀/하프, 슬라이딩)
- 쿠폰 시스템 (조회, 다운로드, 적용)
- FAQ & Q&A
- 리뷰 (이미지/평점)
- 공지사항 & 고객지원
- 프로모션 & 할인 코드

### 클레임
- 반품/교환 요청
- 주문 상태 추적

---

## 주요 패턴

| 패턴 | 설명 |
|------|------|
| API 에러 처리 | `error.data.data.error.{code, message}` 구조, 상태별 분기 |
| SSR/Client 분리 | `import.meta.server` / `import.meta.client` 가드 |
| 데이터 변환 | Composable 내에서 API 응답 → UI 객체 매핑 |
| 반응형 상태 | computed, deep watch, immediate 평가 |
| 다국어 대응 | 모든 UI 텍스트를 JSON 데이터 파일로 분리 |
| 접근성 | 시맨틱 HTML, ARIA, 키보드 지원, 스킵 링크 |
