import { promisify } from 'util'
import { google } from 'googleapis'

import config from '../../../../secrets/config'
import authorize from './gsheets-authorize'

const sheets = google.sheets('v4')
const getValues = promisify(sheets.spreadsheets.values.get).bind(sheets)

type GSheetLoadResult = Promise<{
  labels: Row
  rows: Row[]
}>
export async function loadFromGSheets(): GSheetLoadResult {
  // TODO: understand this TS quirk. It shouldn't require callback because it is promisifed.
  const noop = () => {}
  return authorize(noop)
    .then((auth: any) =>
      getValues({
        spreadsheetId: config.sheets.indexSheetId,
        range: 'Index!A:ZZ',
        auth,
      })
    )
    .then((res: any) => {
      const [labels, ...rows] = res.data.values
      return { labels, rows }
    })
}

export function labelRows(labels: string[], row: string[]): HashMap {
  return row.reduce((client: HashMap, column, idx) => {
    const label = labels[idx]
    client[label] = column
    return client
  }, {})
}
