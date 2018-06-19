const fs = require('fs').promises
const { resolve } = require('path')
const { promisify } = require('util')
const csv = promisify(require('csv-parse'))

async function loadCSV(csvPath) {
  try {
    const file = await fs.readFile(resolve(csvPath))
    return await csv(file)
  } catch (err) {
    console.error('Failed to load the CSV!')
    console.error(err)
    process.exit(1)
  }
}

async function parseCSV(path) {
  const [labels, ...rows] = await loadCSV(path)

  // { [idx]: 'label', ... }
  const labelMap = labels.reduce((labels, label, idx) => {
    labels[idx] = label
    return labels
  }, {})

  const labeledRows = rows.map(row => {
    return row.reduce((acc, column, idx) => {
      const colName = labelMap[idx]
      acc[colName] = column
      return acc
    }, {})
  })

  return {
    labels: Object.values(labelMap),
    data: labeledRows
  }
}

module.exports = {
  parseCSV
}
