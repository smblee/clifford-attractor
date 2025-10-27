// Central index for all attractor configurations
export * from "./types"
export { cliffordConfig } from "./clifford"
export { halvorsenConfig } from "./halvorsen"
export { aizawaConfig } from "./aizawa"
export { peterDeJongConfig } from "./peter-de-jong"
export { rabinovichFabrikantConfig } from "./rabinovich-fabrikant"
export { sprottAConfig, sprottBConfig, sprottCConfig } from "./sprott"

import { cliffordConfig } from "./clifford"
import { halvorsenConfig } from "./halvorsen"
import { aizawaConfig } from "./aizawa"
import { peterDeJongConfig } from "./peter-de-jong"
import { rabinovichFabrikantConfig } from "./rabinovich-fabrikant"
import { sprottAConfig, sprottBConfig, sprottCConfig } from "./sprott"
import { AttractorConfig } from "./types"

// Map of all available attractors
export const attractorRegistry: Record<string, AttractorConfig> = {
  "clifford": cliffordConfig,
  "halvorsen": halvorsenConfig,
  "aizawa": aizawaConfig,
  "peter-de-jong": peterDeJongConfig,
  "rabinovich-fabrikant": rabinovichFabrikantConfig,
  "sprott-a": sprottAConfig,
  "sprott-b": sprottBConfig,
  "sprott-c": sprottCConfig,
}

