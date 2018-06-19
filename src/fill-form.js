const path = require('path')
const { mkdir } = require('fs').promises
const { promisify } = require('util')
const { curry } = require('ramda')
const pdf = require('pdffiller')
const chalk = require('chalk')
const fill = promisify(pdf.fillFormWithFlatten).bind(pdf)

const { parseCSV } = require('./parse-csv')
const { validateForm } = require('./validate-form')

async function fillPDFs({
  pdfPaths,
  csvPath,
  outputFolder,
  outputNametag,
  quiet,
  labels,
  data
}) {
  if (!Array.isArray(pdfPaths)) {
    pdfPaths = [pdfPaths]
  }

  try {
    await ensureFolderExists(outputFolder)
  } catch (err) {
    console.err(`Output folder ${outputFolder} does not exist! Typo?`)
    process.exit(1)
  }

  await verifyDataHaveNametags(outputNametag, data)

  const formFills = pdfPaths
    .map(pdfPath => {
      return data.map(row => {
        const nametag = row[outputNametag]
        const filename = `${path.parse(pdfPath).name}_${nametag}.pdf`
        const outputPath = path.join(outputFolder, filename)
        return fillPDF(pdfPath, outputPath, row).then(() => {
          if (!quiet) {
            console.log(chalk.blue('Filled: '), filename)
          }
        })
      })
    })
    .reduce((a, i) => a.concat(i), [])

  return await Promise.all(formFills)
}

async function fillFromCSV({
  pdfPaths,
  csvPath,
  outputFolder,
  outputNametag,
  quiet
}) {
  const { labels, data } = await parseCSV(csvPath)
  await fillPDFs({
    pdfPaths: pdfPaths,
    csvPath,
    outputFolder,
    outputNametag,
    quiet,
    labels,
    data
  })
}

function fillPDF(pdfPath, outputPath, data) {
  return fill(pdfPath, outputPath, data, false)
}

function verifyDataHaveNametags(nametag, data) {
  const tags = {}
  return data.every(row => {
    if (tags[nametag]) {
      console.error(
        `Error: We found two rows with the same nametag: ${tags[nametag]}`
      )
      process.exit(1)
    }

    if (nametag in row) {
      tags[nametag] = row[nametag]
      return true
    } else {
      console.error(
        `Error: There is a row without a nametag. row's data: ${Object.values(
          row
        )}`
      )
      process.exit(1)
    }
  })
}

async function ensureFolderExists(folderPath) {
  return mkdir(folderPath).catch(error => {
    if (error.code === 'EEXIST') return Promise.resolve()
    else throw error
  })
}

module.exports = {
  fillPDF: curry(fillPDF),
  fillPDFs,
  fillFromCSV,
}
