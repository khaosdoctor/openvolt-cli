import { fetchClientFactory } from './baseClient.js'
import { AppConfig } from '../cli.js'

export type ISODate = `${string}-${string}-${string}T${string}:${string}:${string}.${string}Z`
interface Interval {
  start_interval: ISODate
  meter_id: string
  meter_number: string
  customer_id: string
  consumption: string
  consumption_units: string
}

export interface IntervalData {
  startInterval: ISODate
  endInterval: ISODate
  granularity: string
  data: Interval[]
}

export class OpenVoltClient {
  #client
  constructor(config: AppConfig) {
    this.#client = fetchClientFactory(config.OPENVOLT_API_HOST, { headers: { 'x-api-key': config.API_KEY } })
  }

  async getMeter(meterID: string) {
    return this.#client.get<{
      customer: { _id: string; name: string; account: string }
      status: string
      data_source: string
    }>(`/v1/meters/${meterID}`)
  }

  async getIntervalData(meterId: string, start: string, end: string) {
    return this.#client.get<IntervalData>(
      `/v1/interval-data?meter_id=${meterId}&start_date=${start}&end_date=${end}&granularity=hh`,
    )
  }
}
