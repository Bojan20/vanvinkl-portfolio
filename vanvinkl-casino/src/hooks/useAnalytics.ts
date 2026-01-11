/**
 * Simple analytics hook - tracks events to localStorage
 * Safe - no side effects on module load
 */

const STORAGE_KEY = 'vanvinkl-analytics'

interface AnalyticsData {
  sessions: number
  totalSpins: number
  sectionsVisited: string[]
  jackpots: number
  firstVisit: number
  lastVisit: number
}

function getAnalytics(): AnalyticsData {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch {}
  return {
    sessions: 0,
    totalSpins: 0,
    sectionsVisited: [],
    jackpots: 0,
    firstVisit: Date.now(),
    lastVisit: Date.now()
  }
}

function saveAnalytics(data: AnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function trackSession(): void {
  const data = getAnalytics()
  data.sessions++
  data.lastVisit = Date.now()
  saveAnalytics(data)
}

export function trackSpin(): void {
  const data = getAnalytics()
  data.totalSpins++
  saveAnalytics(data)
}

export function trackSectionVisit(section: string): void {
  const data = getAnalytics()
  if (!data.sectionsVisited.includes(section)) {
    data.sectionsVisited.push(section)
    saveAnalytics(data)
  }
}

export function trackJackpot(): void {
  const data = getAnalytics()
  data.jackpots++
  saveAnalytics(data)
}

export function getStats(): AnalyticsData {
  return getAnalytics()
}
