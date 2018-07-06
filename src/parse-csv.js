import { promises } from 'fs'
import { resolve } from 'path'
import csv from 'csv-parse'

const fs = promises

async function loadCSV(csvPath) {
  try {
    const file = await fs.readFile(resolve(csvPath))
    return await csv(file)
  } catch (err) {
    console.error('Failed to load the CSV!')
    console.error(err)
    return process.exit(1)
  }
}

export default async function parseCSV(path) {
  const [labels, ...rows] = await loadCSV(path)

  // { [idx]: 'label', ... }
  const labelMap = labels.reduce((map, label, idx) => {
    map[idx] = label
    return map
  }, {})

  const labeledRows = rows.map(row =>
    row.reduce((acc, column, idx) => {
      const colName = labelMap[idx]
      acc[colName] = column
      return acc
    }, {})
  )

  return {
    labels: Object.values(labelMap),
    data: labeledRows,
  }
}
