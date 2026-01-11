/**
 * Achievements System - Track user progress and unlock rewards
 *
 * Persisted in localStorage for cross-session tracking
 */

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  secret?: boolean // Hidden until unlocked
}

// Achievement definitions
const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Exploration
  { id: 'first_spin', title: 'First Roll', description: 'Spin the slot machine for the first time', icon: '🎰' },
  { id: 'visit_skills', title: 'Skill Scout', description: 'Visit the Skills section', icon: '⚡' },
  { id: 'visit_projects', title: 'Project Explorer', description: 'Visit the Projects section', icon: '🚀' },
  { id: 'visit_experience', title: 'Time Traveler', description: 'Visit the Experience section', icon: '⏳' },
  { id: 'visit_services', title: 'Service Seeker', description: 'Visit the Services section', icon: '💼' },
  { id: 'visit_about', title: 'Get to Know Me', description: 'Visit the About section', icon: '👤' },
  { id: 'visit_all', title: 'Grand Tour', description: 'Visit all sections', icon: '🏆' },

  // Interaction
  { id: 'ten_spins', title: 'High Roller', description: 'Spin 10 times', icon: '🎲' },
  { id: 'jackpot', title: 'Jackpot!', description: 'Hit a jackpot combination', icon: '💎' },
  { id: 'detail_view', title: 'Deep Dive', description: 'Open a detail modal', icon: '🔍' },

  // Secret achievements
  { id: 'konami', title: 'Old School Gamer', description: 'Enter the Konami code', icon: '🎮', secret: true },
  { id: 'night_owl', title: 'Night Owl', description: 'Browse after midnight', icon: '🦉', secret: true },
  { id: 'early_bird', title: 'Early Bird', description: 'Browse before 6 AM', icon: '🐦', secret: true },
  { id: 'speed_demon', title: 'Speed Demon', description: 'Visit all sections in under 60 seconds', icon: '⚡', secret: true },
]

// Storage key
const STORAGE_KEY = 'vanvinkl-achievements'

class AchievementStore {
  private achievements: Map<string, Achievement> = new Map()
  private listeners: Set<(achievement: Achievement) => void> = new Set()
  private visitedSections: Set<string> = new Set()
  private spinCount = 0
  private firstVisitTime = 0

  constructor() {
    this.loadFromStorage()
    this.firstVisitTime = Date.now()
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const savedData = saved ? JSON.parse(saved) : {}

      // Initialize all achievements
      ACHIEVEMENT_DEFS.forEach(def => {
        const savedAchievement = savedData[def.id]
        this.achievements.set(def.id, {
          ...def,
          unlocked: savedAchievement?.unlocked ?? false,
          unlockedAt: savedAchievement?.unlockedAt
        })
      })
    } catch (e) {
      console.warn('[Achievements] Failed to load:', e)
      // Initialize with defaults
      ACHIEVEMENT_DEFS.forEach(def => {
        this.achievements.set(def.id, { ...def, unlocked: false })
      })
    }
  }

  private saveToStorage(): void {
    const data: Record<string, { unlocked: boolean, unlockedAt?: number }> = {}
    this.achievements.forEach((ach, id) => {
      data[id] = { unlocked: ach.unlocked, unlockedAt: ach.unlockedAt }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * Unlock an achievement
   */
  unlock(id: string): boolean {
    const achievement = this.achievements.get(id)
    if (!achievement || achievement.unlocked) return false

    achievement.unlocked = true
    achievement.unlockedAt = Date.now()
    this.saveToStorage()

    // Notify listeners
    this.listeners.forEach(cb => cb(achievement))

    console.log(`[Achievement] Unlocked: ${achievement.title}`)
    return true
  }

  /**
   * Get all achievements
   */
  getAll(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  /**
   * Get unlocked achievements
   */
  getUnlocked(): Achievement[] {
    return this.getAll().filter(a => a.unlocked)
  }

  /**
   * Get visible achievements (unlocked + non-secret locked)
   */
  getVisible(): Achievement[] {
    return this.getAll().filter(a => a.unlocked || !a.secret)
  }

  /**
   * Check if achievement is unlocked
   */
  isUnlocked(id: string): boolean {
    return this.achievements.get(id)?.unlocked ?? false
  }

  /**
   * Subscribe to unlock events
   */
  onUnlock(callback: (achievement: Achievement) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // ==========================================
  // TRACKING METHODS - Call these from components
  // ==========================================

  /**
   * Track a spin
   */
  trackSpin(): void {
    this.spinCount++
    if (this.spinCount === 1) {
      this.unlock('first_spin')
    }
    if (this.spinCount === 10) {
      this.unlock('ten_spins')
    }
  }

  /**
   * Track section visit
   */
  trackSectionVisit(sectionId: string): void {
    const sectionMap: Record<string, string> = {
      'skills': 'visit_skills',
      'projects': 'visit_projects',
      'experience': 'visit_experience',
      'services': 'visit_services',
      'about': 'visit_about'
    }

    if (sectionMap[sectionId]) {
      this.unlock(sectionMap[sectionId])
      this.visitedSections.add(sectionId)

      // Check for "visit all" achievement
      const allSections = ['skills', 'projects', 'experience', 'services', 'about']
      if (allSections.every(s => this.visitedSections.has(s))) {
        this.unlock('visit_all')

        // Check for speed demon (under 60 seconds)
        if (Date.now() - this.firstVisitTime < 60000) {
          this.unlock('speed_demon')
        }
      }
    }
  }

  /**
   * Track jackpot
   */
  trackJackpot(): void {
    this.unlock('jackpot')
  }

  /**
   * Track detail view
   */
  trackDetailView(): void {
    this.unlock('detail_view')
  }

  /**
   * Track Konami code
   */
  trackKonami(): void {
    this.unlock('konami')
  }

  /**
   * Check time-based achievements
   */
  checkTimeAchievements(): void {
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 6) {
      this.unlock('night_owl')
      this.unlock('early_bird')
    }
  }

  /**
   * Get completion percentage
   */
  getCompletionPercent(): number {
    const total = this.achievements.size
    const unlocked = this.getUnlocked().length
    return Math.round((unlocked / total) * 100)
  }
}

// Singleton
export const achievementStore = new AchievementStore()

// Check time achievements on load
achievementStore.checkTimeAchievements()
