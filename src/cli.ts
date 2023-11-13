#!/usr/bin/env tsx --no-warnings
import 'dotenv/config'
import { z } from 'zod'
import { program } from 'commander'
import { CarbonIntensityClient } from './clients/carbonIntensityClient.js'
import { analysisCommand } from './commands/analysis.js'
import { OpenVoltClient } from './clients/openvoltClient.js'

const envSchema = z.object({
  API_KEY: z.string(),
  OPENVOLT_API_HOST: z.string().optional().default('https://api.openvolt.com'),
  NG_CI_API_HOST: z.string().optional().default('https://api.carbonintensity.org.uk'),
  DEFAULT_METER: z.string().optional().default('6514167223e3d1424bf82742'),
})

const config = envSchema.parse(process.env)
export type AppConfig = z.infer<typeof envSchema>

const clients = {
  openVolt: new OpenVoltClient(config),
  carbonIntensity: new CarbonIntensityClient(config),
}
export type Clients = typeof clients

program
  .name('OpenVolt CLI')
  .description('Fetches energy information from OpenVolt')
  .version((await import('../package.json')).default.version)

program
  .command('analysis')
  .description('Gets analysis of the energy consumption of a meter')
  .argument('[meterId]', 'Meter ID to fetch analysis for', config.DEFAULT_METER)
  .option('-s, --start <date>', 'Start date for analysis', '2023-01-01')
  .option('-e, --end <date>', 'End date for analysis', '2023-01-31')
  .action(analysisCommand(clients))

program.parse()
