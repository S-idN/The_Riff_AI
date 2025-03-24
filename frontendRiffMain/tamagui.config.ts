import { createInterFont } from '@tamagui/font-inter'
import { createTamagui, createTokens } from 'tamagui'

const interFont = createInterFont()

// Define tokens first
const tokens = createTokens({
  size: {
    $0: 0,
    $1: 4,
    $2: 8, 
    $3: 16,
    $4: 24,
    $5: 32,
    $6: 48,
    $7: 64,
    $8: 96,
    $true: 24, // default size
  },
  space: {
    $0: 0,
    $1: 4,
    $2: 8,
    $3: 16,
    $4: 24,
    $5: 32,
    $6: 48,
    $7: 64,
    $8: 96,
    $true: 24, // default space
  },
  radius: {
    $0: 0,
    $1: 4,
    $2: 8,
    $3: 16,
    $4: 24,
    $5: 32,
    $true: 8, // default radius
  },
  zIndex: {
    $0: 0,
    $1: 100,
    $2: 200,
    $3: 300,
    $4: 400,
    $5: 500,
    $true: 100,
  },
  color: {
    $background: '#1a1a2e',
    $color: '#e5d8fc',
  },
})

// Create a simpler configuration for Expo
const tamaguiConfig = createTamagui({
  defaultTheme: 'dark',
  fonts: {
    heading: interFont,
    body: interFont,
  },
  themes: {
    light: {
      background: '#ffffff',
      backgroundHover: '#f5f5f5',
      color: '#000000',
      colorHover: '#333333',
      borderColor: '#e1e1e1',
      borderColorHover: '#c4c4c4',
    },
    dark: {
      background: '#1a1a2e',
      backgroundHover: '#2a2a3e',
      color: '#e5d8fc',
      colorHover: '#ffffff',
      borderColor: '#3a3a4e',
      borderColorHover: '#4a4a5e',
    },
  },
  tokens,
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

type AppConfig = typeof tamaguiConfig
export default tamaguiConfig
export type { AppConfig }