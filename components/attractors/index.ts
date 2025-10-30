// Central index for all attractor configurations

export { aizawaConfig } from "./aizawa"
export { cliffordConfig } from "./clifford"
export { halvorsenConfig } from "./halvorsen"
export { peterDeJongConfig } from "./peter-de-jong"
export { rabinovichFabrikantConfig } from "./rabinovich-fabrikant"
export { sprottAConfig, sprottBConfig, sprottCConfig } from "./sprott"
export * from "./types"

import { aizawaConfig } from "./aizawa"
import { cliffordConfig } from "./clifford"
import { halvorsenConfig } from "./halvorsen"
import { peterDeJongConfig } from "./peter-de-jong"
import { rabinovichFabrikantConfig } from "./rabinovich-fabrikant"
import { sprottAConfig, sprottBConfig, sprottCConfig } from "./sprott"
import type { AttractorConfig } from "./types"

// Map of all available attractors
export const attractorRegistry: Record<string, AttractorConfig> = {
  clifford: cliffordConfig,
  halvorsen: halvorsenConfig,
  aizawa: aizawaConfig,
  "peter-de-jong": peterDeJongConfig,
  "rabinovich-fabrikant": rabinovichFabrikantConfig,
  "sprott-a": sprottAConfig,
  "sprott-b": sprottBConfig,
  "sprott-c": sprottCConfig,
}
