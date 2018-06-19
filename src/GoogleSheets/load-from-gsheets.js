const { promisify } = require('util')
const { google } = require('googleapis')

const secrets = require('./../../secrets')
const { authorize } = require('./authorize')

const sheets = google.sheets('v4')
const getValues = promisify(sheets.spreadsheets.values.get).bind(sheets)

async function loadFromGSheets(clientID) {
  return await authorize()
    .then(auth => {
      return getValues({
        spreadsheetId: secrets.sheets.indexSheetId,
        range: 'Index!A1:N2000',
        auth
      })
    })
    .then(res => {
      const [header, ...rows] = res.data.values
      const headerMap = header.reduce((acc, label, idx) => {
        acc[label] = label in acc ? acc[label].concat([idx]) : [idx]
        return acc
      }, {})
      const clientRow = rows.find(row => row[0] === String(clientID))
      if (!clientRow) {
        console.error(`We couldn't find any rows with the ID of ${clientID}`)
        process.exit(1)
      }
      const clientData = clientRow.reduce((client, col, idx) => {
        const entry = Object.entries(headerMap).find(([label, idxs]) =>
          idxs.includes(idx)
        )
        client[entry[0]] = col
        return client
      }, {})
      console.log('1281 client data:', clientData)
    })
    .catch(err => console.error('Error getting values:', err))
}

module.exports = loadFromGSheets
