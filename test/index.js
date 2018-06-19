// read pdf with empty fields
//
// fill fields
//
// write pdf
//
// read pdf, check fields are filled

const simpleTest = './test/fixtures/simple-test.pdf'
const realLifeTest = './test/fixtures/real-life-test.pdf'
const aeCaf = './test/fixtures/AE CAF 2018.pdf'
const aepPath = './test/fixtures/AEP Texas Interconnection Application.pdf'
const aepCSV = './test/fixtures/aep-test-data.csv'

const { fillFromCSV } = require('./../index')

fillFromCSV({
  pdfPaths: [aepPath, simpleTest],
  csvPath: aepCSV,
  outputFolder: './test/fixtures/output',
  outputNametag: 'Customers Name',
})
