const { fillPDFs, fillFromCSV } = require('./fill-form')
const loadFromGSheets = require('./GoogleSheets/load-from-gsheets')

module.exports = {
  fillPDFs,
  fillFromCSV,
  loadFromGSheets,
}

// potentially useful pdftk flag:
// { need_appearances: true }
