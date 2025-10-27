import * as THREE from "three"
import { AudioData, AttractorConfig } from "./types"

// Halvorsen Attractor (3D chaotic system)
// dx/dt = -a·x - 4·y - 4·z - y²
// dy/dt = -a·y - 4·z - 4·x - z²
// dz/dt = -a·z - 4·x - 4·y - x²
function calculateHalvorsen(
  positions: Float32Array,
  colors: Float32Array,
  params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData
) {
  const { a = 1.4 } = params
  const dt = 0.005 // Time step
  const scale = 0.08

  let x = 0.1
  let y = 0
  let z = 0

  for (let i = 0; i < iterations; i++) {
    const dx = -a * x - 4 * y - 4 * z - y * y
    const dy = -a * y - 4 * z - 4 * x - z * z
    const dz = -a * z - 4 * x - 4 * y - x * x

    x += dx * dt
    y += dy * dt
    z += dz * dt

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    // Color based on 3D position
    const distance = Math.sqrt(x * x + y * y + z * z)
    const hue = (Math.atan2(z, x) / Math.PI + 1) * 0.5
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + distance * 0.02

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

export const halvorsenConfig: AttractorConfig = {
  name: "Halvorsen",
  description: "3D chaotic flow system",
  dimension: "3D",
  iterations: 50000,
  calculate: calculateHalvorsen,
  audioMappings: [
    { param: "a", band: "bass", intensity: 0.4 },    // Bass affects chaos/flow intensity
  ],
}

