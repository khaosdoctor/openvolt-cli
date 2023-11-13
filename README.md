# openvolt CLI

> Gathers and displays energy consumption information from OpenVolt and other sources

# Installation

This is a CLI tool, you can clone it locally with `git clone` and either run it directly with npm or manually.

You will need to create a `.env` file with the following variables defined in [`.env.example`](./.env.sample)

![](./usagegif.gif)

## Steps

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm link` to link the CLI to your system
4. Run `openvolt` to start the CLI

You can also execute the file directly from the `src` folder with `tsx` using `npm start`.

> If you have any issues with the installation, please install `tsx` globally with `npm i -g tsx` (this shouldn't be necessary in most cases)

## Usage

There's only one command called `analysis`, you can run `openvolt -h` or `openvolt help analysis` to see the options.

```bash
❯ openvolt -h
Usage: OpenVolt CLI [options] [command]

Fetches energy information from OpenVolt

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  analysis [options] [meterId]  Gets analysis of the energy consumption of a meter
  help [command]                display help for command
```

You can optionally supply a meter ID and a date range to get the analysis for that specific time using `openvolt analysis [meterId] -s [startDate] -e [endDate]`. Dates **must** be in the ISO format `YYYY-MM-DDTHH:MM:SS.ZZZZ`.

> Running it in larger terminals will make the output easier to read
