// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // DevTools: 개발 중 네트워크 호출 줄이려면 false
  devtools: { enabled: false },

  future: {
    compatibilityVersion: 4
  },

  runtimeConfig: {
    // Server-only (클라이언트에 노출되지 않음)
    apiBaseUrl: process.env.API_BASE_URL || '', // API_BASE_URL 환경변수 사용 (서버 프록시)

    // Public (클라이언트에 노출)
    public: {
      // Safari 쿠키 문제 해결을 위해 /api 프록시 사용
      apiBase: '/api',
      tossClientKey: '',
      naverClientId: '',
      naverRedirectUri: '',
      googleClientId: '',
      googleRedirectUri: ''
    }
  },

  modules: [
    '@pinia/nuxt',
    // '@nuxt/a11y', // 접근성 검사 - 필요시 주석 해제
    '@nuxt/eslint',
    // '@nuxt/fonts', // CDN 직접 로드로 대체 (이중 로드 방지)
    // '@nuxt/icon', // 커스텀 아이콘 사용으로 비활성화
    '@nuxt/image'
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  css: [
    '~/assets/styles/main.scss'
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'ko'
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://cdn.jsdelivr.net',
          crossorigin: 'anonymous'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous'
        },
        {
          rel: 'preconnect',
          href: 'https://d1a5ndqai9bpji.cloudfront.net'
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap'
        }
      ]
    },
    pageTransition: {
      name: 'page'
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  },

  image: {
    // 로컬 이미지는 <img> 태그 또는 provider="" 사용
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    }
  },

  nitro: {
    compressPublicAssets: true,
    minify: true,
    routeRules: {
      '/_nuxt/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' }
      },
      '/images/**': {
        headers: { 'cache-control': 'public, max-age=86400, s-maxage=86400' }
      }
    }
  }
})