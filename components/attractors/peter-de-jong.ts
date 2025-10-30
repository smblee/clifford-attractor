import * as THREE from "three"
import type { AttractorConfig, AudioData } from "./types"

// Peter de Jong Attractor (2D map)
// xₙ₊₁ = sin(a·yₙ) - cos(b·xₙ)
// yₙ₊₁ = sin(c·xₙ) - cos(d·yₙ)
function calculatePeterDeJong(
  positions: Float32Array,
  colors: Float32Array,
  params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData,
) {
  // Use classic Peter de Jong values as defaults
  const { a = 1.4, b = -2.3, c = 2.4, d = -2.1 } = params
  const scale = 0.35

  let x = 0
  let y = 0

  for (let i = 0; i < iterations; i++) {
    const xNew = Math.sin(a * y) - Math.cos(b * x)
    const yNew = Math.sin(c * x) - Math.cos(d * y)

    x = xNew
    y = yNew

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = 0

    // Color gradient based on position
    const hue = (Math.atan2(y, x) / Math.PI + 1) * 0.5
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + Math.sqrt(x * x + y * y) * 0.1

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

export const peterDeJongConfig: AttractorConfig = {
  name: "Peter de Jong",
  description: "Beautiful 2D map attractor",
  dimension: "2D",
  iterations: 75000,
  calculate: calculatePeterDeJong,
  audioMappings: [
    { param: "a", band: "bass", intensity: 0.4 }, // Bass affects horizontal patterns
    { param: "b", band: "mid", intensity: 0.4 }, // Mid affects vertical patterns
    { param: "c", band: "high", intensity: 0.3 }, // High affects rotation
    { param: "d", band: "volume", intensity: 0.3 }, // Volume affects overall spread
  ],
}
