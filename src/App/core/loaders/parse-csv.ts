import { promises } from 'fs'
import { resolve } from 'path'
import csv from 'csv-parse'

const fs = promises

async function loadCSV(csvPath: string) {
  try {
    const file = await fs.readFile(resolve(csvPath))
    // TODO: remove type cast. It seems that csv-parse's d.ts has incorrect types
    return await (<any>csv(String(file)))
  } catch (err) {
    console.error('Failed to load the CSV!')
    console.error(err)
    return process.exit(1)
  }
}

export default async function parseCSV(path: string) {
  const [labels, ...rows]: [string[], string[]] = await loadCSV(path)

  // { [idx]: 'label', ... }
  const labelMap = labels.reduce(
    (map, label, idx) => {
      map[idx] = label
      return map
    },
    {} as HashMap
  )

  const labeledRows = rows.map(row =>
    row.reduce(
      (acc, column, idx) => {
        const colName = labelMap[idx]
        acc[colName] = column
        return acc
      },
      {} as HashMap
    )
  )

  return {
    labels: Object.values(labelMap),
    data: labeledRows,
  }
}
