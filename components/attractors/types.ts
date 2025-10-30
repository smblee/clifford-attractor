// Shared types for all attractors

// Audio data interface
export interface AudioData {
  bass: number
  mid: number
  high: number
  volume: number
}

// Audio frequency bands
export type AudioBand = "bass" | "mid" | "high" | "volume"

// Audio mapping for a single parameter
export interface AudioMapping {
  param: string // Which parameter to modulate
  band: AudioBand // Which frequency band to use
  intensity: number // How much to modulate (multiplier)
}

// Calculation function signature that all attractors must implement
export type CalculateFunction = (
  positions: Float32Array,
  colors: Float32Array,
  params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData,
) => void

// Attractor configuration interface
export interface AttractorConfig {
  name: string
  description: string
  dimension: "2D" | "3D"
  iterations: number
  calculate: CalculateFunction
  audioMappings?: AudioMapping[] // Optional: custom audio reactivity mappings
}
