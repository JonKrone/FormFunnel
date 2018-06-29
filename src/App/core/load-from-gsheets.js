const { promisify } = require('util')
const { google } = require('googleapis')

const secrets = require('./../../../secrets')
const { authorize } = require('./authorize')

const sheets = google.sheets('v4')
const getValues = promisify(sheets.spreadsheets.values.get).bind(sheets)

async function loadFromGSheets() {
  return authorize()
    .then(auth =>
      getValues({
        spreadsheetId: secrets.sheets.indexSheetId,
        range: 'Index!A1:N2000',
        auth,
      })
    )
    .then(res => {
      const [labels, ...rows] = res.data.values
      return { labels, rows }
    })
}

async function loadClient(clientID) {
  return loadFromGSheets().then(({ labels, rows }) => {
    const clientRow = rows.find(row => row[0] === String(clientID))
    return labelRows(labels, clientRow)
  })
}

// // ['a', 'b'], [1, 2] => [['a', 1], ['b', 2]]
// // [[label, value]]
function labelRows(labels, rows) {
  if (!Array.isArray(rows[0])) rows = [rows]
  if (labels.length !== rows[0].length) {
    throw new Error('Cannot zip labels and rows with non-equal length')
  }

  const labelMap = labels.reduce((acc, label, idx) => {
    acc[label] = label in acc ? acc[label].concat([idx]) : [idx]
    return acc
  }, {})

  return rows.map(row =>
    row.reduce((client, column, idx) => {
      const [label] = Object.entries(labelMap).find(([_, idxs]) =>
        idxs.includes(idx)
      )
      client[label] = column
      return client
    }, {})
  )
}

module.exports = {
  loadFromGSheets,
  loadClient,
  labelRows,
}
