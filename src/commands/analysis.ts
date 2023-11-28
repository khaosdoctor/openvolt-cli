import ObjectID from 'bson-objectid'
import chalk from 'chalk'
import ervy from 'ervy' // not typed had to add definition file
import ora, { Ora } from 'ora'
import { FuelType, IntensityData, MixData } from '../clients/carbonIntensityClient.js'
import { Clients } from '../cli.js'
import { IntervalData } from '../clients/openvoltClient.js'

const fuelColors: Record<FuelType, string> = {
  [FuelType.BIOMASS]: 'green',
  [FuelType.COAL]: 'black',
  [FuelType.IMPORTS]: 'red',
  [FuelType.GAS]: 'magenta',
  [FuelType.NUCLEAR]: 'cyan',
  [FuelType.OTHER]: 'white',
  [FuelType.HYDRO]: 'blue',
  [FuelType.SOLAR]: 'yellow',
  [FuelType.WIND]: 'white',
}

function performValidation(spinner: Ora, meterId: string, startDate: Date, endDate: Date) {
  if (!ObjectID.default.isValid(meterId)) {
    spinner.fail('Invalid meter ID')
    return false
  }

  if (startDate > endDate) {
    spinner.fail('Start date must be before end date')
    return false
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    spinner.fail('Invalid date')
    return false
  }

  return true
}

async function printCustomerInfo(clients: Clients, meterId: string, spinner: Ora) {
  spinner.start('Fetching customer data')
  const customerData = await clients.openVolt.getMeter(meterId)
  spinner.info('Fetched customer data')

  console.log(`
  ${chalk.bold('Customer')}: ${chalk.italic(customerData.customer.name)}
  ${chalk.bold('Account')}: ${chalk.italic(customerData.customer.account)}
  ${chalk.bold('Status')}: ${
    customerData.status === 'active' ? chalk.italic.green(customerData.status) : chalk.italic.red(customerData.status)
  }
  ${chalk.bold('Data Source')}: ${chalk.italic.cyan(customerData.data_source)}
  `)
}

async function fetchElectricData(
  options: { start: string; end: string },
  spinner: Ora,
  meterId: string,
  clients: Clients,
): Promise<[IntervalData, MixData, IntensityData]> {
  spinner.start(`Fetching all data`)
  const allData = await Promise.all([
    clients.openVolt.getIntervalData(meterId, options.start, options.end),
    clients.carbonIntensity.getMix(options.start, options.end),
    clients.carbonIntensity.getIntensity(options.start, options.end),
  ])
  spinner.succeed(`Fetched interval data`)
  spinner.succeed('Fetched fuel mix data')
  spinner.succeed('Fetched carbon intensity data')
  return allData
}

async function normalizeFuelMixData(
  fuelMixChartData: Map<FuelType, { key: FuelType; value: number; style: unknown }>,
  totalResults: number,
) {
  // normalize fuel mix data to 100%
  const normalizedMixData = []
  const tableData: Record<string, number> = {}
  for (const chartMixData of fuelMixChartData.values()) {
    const normalizedValue = Math.round(chartMixData.value / totalResults)
    normalizedMixData.push({
      key: chartMixData.key.at(0)?.toUpperCase(),
      value: normalizedValue,
      style: chartMixData.style,
    })
    tableData[
      `% of ${chalk.underline.bold(chartMixData.key.at(0)?.toUpperCase())}${chartMixData.key.substring(1)} fuel`
    ] = normalizedValue
  }

  return {
    normalizedMixData,
    tableData,
  }
}

async function runAnalisys(spinner: Ora, voltData: IntervalData, mixData: MixData, carbonData: IntensityData) {
  spinner.start('Running analysis...')
  let totalResults = Math.max(voltData.data.length, mixData.data.length, carbonData.data.length)
  let totalConsumption = 0
  let totalCarbonEmission = 0
  let fuelMixChartData: Map<FuelType, { key: FuelType; value: number; style: unknown }> = new Map()

  for (let i = 0; i < totalResults; i++) {
    spinner.text = `Running analysis... (${i + 1}/${totalResults})`
    const voltInterval = voltData.data[i]
    const mixInterval = mixData.data[i]
    const carbonInterval = carbonData.data[i]

    const voltStartDate = new Date(voltInterval.start_interval).getTime()
    const mixStartDate = new Date(mixInterval.to).getTime()
    const carbonStartDate = new Date(carbonInterval.to).getTime()

    // sanity check
    if (voltStartDate !== mixStartDate || voltStartDate !== carbonStartDate) {
      spinner.fail('Interval data is not aligned')
      process.exit(1)
    }

    totalConsumption += Number(voltInterval.consumption)
    totalCarbonEmission += carbonInterval.intensity.actual * Number(voltInterval.consumption)

    // add fuel mix data
    for (const mix of mixInterval.generationmix) {
      if (!fuelMixChartData.has(mix.fuel)) {
        fuelMixChartData.set(mix.fuel, { key: mix.fuel, value: 0, style: ervy.bg(fuelColors[mix.fuel]) })
      }

      fuelMixChartData.set(mix.fuel, {
        key: mix.fuel,
        value: fuelMixChartData.get(mix.fuel)!.value + (mix.perc * Number(voltInterval.consumption)) / 100,
        style: ervy.bg(fuelColors[mix.fuel]),
      })
    }
  }

  spinner.succeed('Analysis complete')
  spinner.clear()

  const { normalizedMixData, tableData } = await normalizeFuelMixData(fuelMixChartData, totalResults)

  return {
    totalResults,
    totalConsumption,
    totalCarbonEmission,
    normalizedMixData,
    tableData,
  }
}

export function analysisCommand(clients: Clients) {
  return async (meterId: string, options: { start: string; end: string }) => {
    const spinner = ora().info('Starting analysis...')
    try {
      spinner.info(`Analysing from ${chalk.italic(options.start)} to ${chalk.italic(options.end)}`)
      const startDate = new Date(options.start)
      const endDate = new Date(options.end)
      if (!performValidation(spinner, meterId, startDate, endDate)) return

      await printCustomerInfo(clients, meterId, spinner)
      const [voltData, mixData, carbonData] = await fetchElectricData(options, spinner, meterId, clients)
      const { totalResults, totalConsumption, totalCarbonEmission, normalizedMixData, tableData } = await runAnalisys(
        spinner,
        voltData,
        mixData,
        carbonData,
      )

      // print results
      const formatter = Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })
      console.table({
        'Total Consumption (kWh)': formatter.format(totalConsumption),
        'Average Consumption (kWh)': formatter.format(totalConsumption / totalResults),
        '---': '---',
        'Total Carbon emitted (kg)': formatter.format(totalCarbonEmission),
        'Average Carbon emitted (kg)': formatter.format(totalCarbonEmission / totalResults),
      })

      // Print chart and table
      console.table(tableData)
      console.log(ervy.bar(normalizedMixData))
    } catch (err) {
      spinner.fail((err as Error).message)
      process.exit(1)
    }
  }
}
