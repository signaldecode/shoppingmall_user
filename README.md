
## Setup

Make sure to install dependencies:

```bash
# pnpm
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm dev
```

## Production

Build the application for production:

```bash
# pnpm
pnpm build

```

Locally preview production build:

```bash

# pnpm
pnpm preview
```

  # Shopping Mall Template

  Nuxt 4 기반 재사용 가능한 쇼핑몰 템플릿

  ## 특징
  - 컴포넌트 기반 설계 (ui / layout / domain 분리)
  - 모든 텍스트 JSON 데이터 분리 (다국어/커스터마이징 용이)
  - Figma 토큰 기반 SCSS 스타일 시스템
  - SEO/접근성 최적화

  ## 기술 스택
  - Nuxt 4 + Vue 3
  - SCSS (토큰 시스템)
  - Pretendard 폰트

  ## 프로젝트 구조
  app/
  ├── components/
  │   ├── ui/          # 범용 UI (Button, Input, Radio...)
  │   ├── layout/      # 레이아웃 (Header, Footer)
  │   └── domain/      # 도메인 (ProductCard, OrderSection...)
  ├── pages/           # 페이지 (조립 전용)
  ├── data/            # JSON 콘텐츠
  ├── assets/styles/   # SCSS (tokens → base → components)
  └── composables/     # API, 유틸리티

  ## 시작하기
  npm install && npm run dev

  ## 커스터마이징
  - 텍스트: app/data/*.json 수정
  - 색상/폰트: assets/styles/tokens/ 수정
  - 컴포넌트: components/ 확장