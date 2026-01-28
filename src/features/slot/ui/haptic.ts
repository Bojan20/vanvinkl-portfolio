// HAPTIC FEEDBACK - Mobile vibration patterns
export const haptic = {
  // Light tap - navigation, hover
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },
  // Medium tap - selection, button press
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25)
    }
  },
  // Strong tap - important actions
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  },
  // Double tap - confirmation
  double: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30])
    }
  },
  // Success pattern - win
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50, 100, 100])
    }
  },
  // Jackpot pattern - big win
  jackpot: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100, 50, 200])
    }
  },
  // Spin pattern - continuous during spin
  spin: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 80, 20, 80, 20])
    }
  }
}
