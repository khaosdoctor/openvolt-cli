import { fetchClientFactory } from './baseClient.js'
import { AppConfig } from '../cli.js'

export const enum FuelType {
  BIOMASS = 'biomass',
  COAL = 'coal',
  IMPORTS = 'imports',
  GAS = 'gas',
  NUCLEAR = 'nuclear',
  OTHER = 'other',
  HYDRO = 'hydro',
  SOLAR = 'solar',
  WIND = 'wind',
}

export interface IntensityData {
  data: {
    from: string
    to: string
    intensity: {
      forecast: number
      actual: number
      index: string
    }
  }[]
}

export interface MixData {
  data: {
    from: string
    to: string
    generationmix: {
      fuel: FuelType
      perc: number
    }[]
  }[]
}

export class CarbonIntensityClient {
  #client
  constructor(config: AppConfig) {
    this.#client = fetchClientFactory(config.NG_CI_API_HOST)
  }

  async getMix(start: string, end: string) {
    return this.#client.get<MixData>(`/generation/${start}/${end}`)
  }

  async getIntensity(start: string, end: string) {
    return this.#client.get<IntensityData>(`/intensity/${start}/${end}`)
  }
}
