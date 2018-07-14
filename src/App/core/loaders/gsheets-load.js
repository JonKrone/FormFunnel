import { promisify } from 'util'
import { google } from 'googleapis'

import config from '../../../../secrets/config'
import authorize from './gsheets-authorize'

const sheets = google.sheets('v4')
const getValues = promisify(sheets.spreadsheets.values.get).bind(sheets)

export async function loadFromGSheets() {
  return authorize()
    .then(auth =>
      getValues({
        spreadsheetId: config.sheets.indexSheetId,
        range: 'Index!A:ZZ',
        auth,
      })
    )
    .then(res => {
      const [labels, ...rows] = res.data.values
      return { labels, rows }
    })
}

export async function loadClient(clientID) {
  return loadFromGSheets().then(({ labels, rows }) => {
    const clientRow = rows.find(row => row[0] === String(clientID))
    return labelRows(labels, clientRow)
  })
}

// // ['a', 'b'], [1, 2] => [['a', 1], ['b', 2]]
// // [[label, value]]
export function labelRows(labels, rows) {
  if (!Array.isArray(rows[0])) rows = [rows]

  // Some rows don't have some tail data
  // Erroring might be the better approach, so leaving the below check
  labels = labels.slice(0, rows[0].length)
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
