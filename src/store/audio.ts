import { create } from 'zustand'

interface AudioState {
  musicVolume: number
  sfxVolume: number
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
}

// NO PERSIST - always start fresh with default values
// These are LOUNGE defaults (not video player)
export const useAudioStore = create<AudioState>((set) => ({
  musicVolume: 0.5,  // 50% default for lounge
  sfxVolume: 0.7,    // 70% default for lounge
  setMusicVolume: (volume: number) => set({ musicVolume: volume }),
  setSfxVolume: (volume: number) => set({ sfxVolume: volume })
}))
