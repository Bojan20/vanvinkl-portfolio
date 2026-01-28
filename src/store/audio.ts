import { create } from 'zustand'

interface AudioState {
  musicVolume: number
  sfxVolume: number
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  musicVolume: 1.0,
  sfxVolume: 1.0,
  setMusicVolume: (volume: number) => set({ musicVolume: volume }),
  setSfxVolume: (volume: number) => set({ sfxVolume: volume })
}))
