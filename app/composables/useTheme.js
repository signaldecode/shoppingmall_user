/**
 * 테마 적용 composable
 * shop-info의 theme 값에 따라 CSS 변수를 동적으로 적용
 */

const THEME_STORAGE_KEY = 'app-theme'

// 테마별 컬러 팔레트 매핑 (모듈 레벨에서 정의 - 인라인 스크립트에서도 사용)
const themeColors = {
  green: {
    primary: {
      50: '#EBF9E6',
      100: '#D5F0CB',
      200: '#BAE6AA',
      300: '#9DDB87',
      400: '#87D36C',
      500: '#71CB52',
      600: '#62BB4A',
      700: '#4EA63F',
      800: '#0C6F23',
      900: '#114A1E'
    }
  },
  brown: {
    primary: {
      50: '#F7F2EC',
      100: '#F4EFEA',
      200: '#E7DFD6',
      300: '#D6CDC3',
      400: '#B4A79A',
      500: '#9A9087',
      600: '#8A8177',
      700: '#6F675E',
      800: '#6B5A47',
      900: '#5A4633'
    }
  },
  blue: {
    primary: {
      50: '#E8EAF6',
      100: '#C5CAE9',
      200: '#9FA8DA',
      300: '#7986CB',
      400: '#5C6BC0',
      500: '#3F51B5',
      600: '#3949AB',
      700: '#303F9F',
      800: '#283593',
      900: '#1A237E'
    }
  },
  gray: {
    primary: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    }
  }
}

/**
 * HEX를 RGB로 변환
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0, 0, 0'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

/**
 * CSS 변수 직접 적용 (순수 함수)
 */
const applyThemeToRoot = (themeName) => {
  if (typeof document === 'undefined') return

  const normalizedTheme = (themeName || 'brown').toLowerCase()
  const colors = themeColors[normalizedTheme] || themeColors.brown
  const root = document.documentElement

  // Primary 컬러 변수 설정
  Object.entries(colors.primary).forEach(([shade, color]) => {
    root.style.setProperty(`--theme-primary-${shade}`, color)
  })

  // 주요 테마 컬러 (800을 메인으로 사용)
  root.style.setProperty('--theme-primary', colors.primary[800])
  root.style.setProperty('--theme-primary-light', colors.primary[100])
  root.style.setProperty('--theme-primary-dark', colors.primary[900])

  // RGB 값 (rgba 사용을 위해)
  root.style.setProperty('--theme-primary-rgb', hexToRgb(colors.primary[800]))
}

export const useTheme = () => {
  const { theme } = useShopInfo()

  /**
   * 테마 CSS 변수 적용 + localStorage 저장
   */
  const applyTheme = (themeName) => {
    if (!import.meta.client) return

    const normalizedTheme = (themeName || 'green').toLowerCase()

    // localStorage에 저장 (뒤로가기 시 빠른 복원용)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
    } catch (e) {
      // localStorage 사용 불가 시 무시
    }

    applyThemeToRoot(normalizedTheme)
  }

  /**
   * 저장된 테마 즉시 적용 (CSS 로드 직후, shop-info 로드 전)
   */
  const restoreSavedTheme = () => {
    if (!import.meta.client) return

    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme) {
        applyThemeToRoot(savedTheme)
      }
    } catch (e) {
      // localStorage 사용 불가 시 무시
    }
  }

  /**
   * 테마 감시 및 자동 적용
   */
  const watchTheme = () => {
    watch(theme, (newTheme) => {
      applyTheme(newTheme)
    }, { immediate: true })
  }

  return {
    theme,
    themeColors,
    applyTheme,
    restoreSavedTheme,
    watchTheme
  }
}
