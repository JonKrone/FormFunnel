import { promisify } from 'util'
import { google } from 'googleapis'

import config from '../../../../secrets/config'
import authorize from './gsheets-authorize'

const sheets = google.sheets('v4')
const getValues = promisify(sheets.spreadsheets.values.get).bind(sheets)

type GSheetLoadResult = Promise<{
  labels: string[]
  rows: string[][]
}>
export async function loadFromGSheets(): GSheetLoadResult {
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

export function labelRows(labels: string[], row: string[]): StringMap {
  return row.reduce((client: StringMap, column, idx) => {
    const label = labels[idx]
    client[label] = column
    return client
  }, {})
}
