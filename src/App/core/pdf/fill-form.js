import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import pdf from 'pdffiller'
import chalk from 'chalk'

import parseCSV from './../loaders/parse-csv'

const fill = promisify(pdf.fillFormWithFlatten).bind(pdf)
const mkdir = promisify(fs.mkdir)

// How many of the last path.sep separated paths to include in the output path
const RELATIVE_OUTPUT_PATH_PART = -3

export async function fillPDFs({ pdfPaths, outputFolder, quiet, data }) {
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

export async function fillFromCSV({ pdfPaths, csvPath, outputFolder, quiet }) {
  const { labels, data } = await parseCSV(csvPath)
  await fillPDFs({
    pdfPaths,
    outputFolder,
    quiet,
    labels,
    data,
  })
}

export function fillPDF(pdfPath, outputPath, data) {
  return fill(pdfPath, outputPath, data, false).catch(error => {
    if (error.message.match(/spawn pdftk ENOENT/)) {
      console.log('Looks like we dont have pdftk')
    }

    throw error
  })
}

async function ensureFolderExists(folderPath) {
  return mkdir(folderPath).catch(error => {
    if (error.code === 'EEXIST') return Promise.resolve()
    throw error
  })
}
