import * as THREE from "three"
import { AudioData, AttractorConfig } from "./types"

// Clifford Attractor (2D map)
// xₙ₊₁ = sin(a·yₙ) + c·cos(a·xₙ)
// yₙ₊₁ = sin(b·xₙ) + d·cos(b·yₙ)
function calculateClifford(
  positions: Float32Array,
  colors: Float32Array,
  params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData
) {
  // Use classic Clifford values as defaults
  const { a = -1.4, b = 1.6, c = 1.0, d = 0.7 } = params
  const scale = 0.5

  let x = 0
  let y = 0

  for (let i = 0; i < iterations; i++) {
    const xNew = Math.sin(a * y) + c * Math.cos(a * x)
    const yNew = Math.sin(b * x) + d * Math.cos(b * y)

    x = xNew
    y = yNew

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = 0

    // Color based on position
    const hue = (Math.atan2(y, x) / Math.PI + 1) * 0.5
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + Math.sqrt(x * x + y * y) * 0.08

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

export const cliffordConfig: AttractorConfig = {
  name: "Clifford",
  description: "Classic 2D strange attractor",
  dimension: "2D",
  iterations: 75000,
  calculate: calculateClifford,
  audioMappings: [
    { param: "a", band: "bass", intensity: 0.5 },    // Bass affects main horizontal shape
    { param: "b", band: "mid", intensity: 0.5 },     // Mid affects main vertical shape
    { param: "c", band: "high", intensity: 0.3 },    // High affects fine detail
    { param: "d", band: "high", intensity: 0.3 },    // High affects fine detail
  ],
}

