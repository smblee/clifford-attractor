import * as THREE from "three"
import type { AttractorConfig, AudioData } from "./types"

// Rabinovich-Fabrikant Attractor (3D)
// dx/dt = y·(z - 1 + x²) + γ·x
// dy/dt = x·(3·z + 1 - x²) + γ·y
// dz/dt = -2·z·(α + x·y)
function calculateRabinovichFabrikant(
  positions: Float32Array,
  colors: Float32Array,
  params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData,
) {
  // Use classic Rabinovich-Fabrikant values as defaults
  const { alpha = 0.14, gamma = 0.1 } = params
  const dt = 0.01
  const scale = 0.25

  let x = 0.1
  let y = 0.1
  let z = 0.5

  for (let i = 0; i < iterations; i++) {
    const dx = y * (z - 1 + x * x) + gamma * x
    const dy = x * (3 * z + 1 - x * x) + gamma * y
    const dz = -2 * z * (alpha + x * y)

    x += dx * dt
    y += dy * dt
    z += dz * dt

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    // Color based on velocity
    const velocity = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const hue = (velocity * 0.5) % 1
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + velocity * 0.05

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

export const rabinovichFabrikantConfig: AttractorConfig = {
  name: "Rabinovich-Fabrikant",
  description: "3D attractor from plasma physics",
  dimension: "3D",
  iterations: 50000,
  calculate: calculateRabinovichFabrikant,
  audioMappings: [
    { param: "alpha", band: "bass", intensity: 0.15 }, // Bass affects plasma dynamics
    { param: "gamma", band: "mid", intensity: 0.12 }, // Mid affects dissipation
  ],
}
