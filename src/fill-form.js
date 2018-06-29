const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const { curry } = require('ramda')
const pdf = require('pdffiller')
const chalk = require('chalk')

const fill = promisify(pdf.fillFormWithFlatten).bind(pdf)
const mkdir = promisify(fs.mkdir)

const { parseCSV } = require('./parse-csv')

// How many of the last path.sep separated paths to include in the output path
const RELATIVE_OUTPUT_PATH_PART = -3

async function fillPDFs({ pdfPaths, outputFolder, quiet, data }) {
  if (!Array.isArray(pdfPaths)) {
    pdfPaths = [pdfPaths]
  }

  try {
    await ensureFolderExists(outputFolder)
  } catch (err) {
    console.warn('Error relating to the outputFolder:', err)
    throw new Error(`Output folder ${outputFolder} does not exist! Typo?`)
  }

  const filledForms = []
  const formFills = pdfPaths
    .map(pdfPath =>
      data.map(row => {
        const outputPath = `${path.join(
          outputFolder,
          path.parse(pdfPath).name
        )}.pdf`
        return fillPDF(pdfPath, outputPath, row).then(() => {
          filledForms.push(outputPath)
          if (!quiet) {
            const relativePart = outputPath
              .split(path.sep)
              .slice(RELATIVE_OUTPUT_PATH_PART)
            console.log(chalk.blue('Filled: '), relativePart)
          }
        })
      })
    )
    .reduce((a, i) => a.concat(i), [])

  return Promise.all(formFills).then(() => filledForms)
}

async function fillFromCSV({ pdfPaths, csvPath, outputFolder, quiet }) {
  const { labels, data } = await parseCSV(csvPath)
  await fillPDFs({
    pdfPaths,
    outputFolder,
    quiet,
    labels,
    data,
  })
}

function fillPDF(pdfPath, outputPath, data) {
  return fill(pdfPath, outputPath, data, false).catch(error => {
    if (error.message.match(/spawn pdftk ENOENT/)) {
      console.log('Looks like we dont have pdftk')
    }

    throw error
  })
}

/* eslint-disable no-unused-vars */
function verifyDataHaveNametags(nametag, data) {
  const tags = {}
  return data.every(row => {
    if (tags[row[nametag]]) {
      throw new Error(
        `There are two rows with the same nametag: ${tags[nametag]}`
      )
    }

    if (nametag in row) {
      tags[nametag] = row[nametag]
      return true
    }
    throw new Error(
      `There is a row without a nametag. row's data: ${Object.values(row)}`
    )
  })
}

async function ensureFolderExists(folderPath) {
  return mkdir(folderPath).catch(error => {
    if (error.code === 'EEXIST') return Promise.resolve()
    throw error
  })
}

module.exports = {
  fillPDF: curry(fillPDF),
  fillPDFs,
  fillFromCSV,
}
