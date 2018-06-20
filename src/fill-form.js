const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { curry } = require('ramda');
const pdf = require('pdffiller');
const chalk = require('chalk');

const fill = promisify(pdf.fillFormWithFlatten).bind(pdf);
const mkdir = promisify(fs.mkdir);

const { parseCSV } = require('./parse-csv');

async function fillPDFs({ pdfPaths, outputFolder, nametag, quiet, data }) {
  if (!Array.isArray(pdfPaths)) {
    pdfPaths = [pdfPaths];
  }

  try {
    await ensureFolderExists(outputFolder);
  } catch (err) {
    console.err(`Output folder ${outputFolder} does not exist! Typo?`);
    process.exit(1);
  }

  await verifyDataHaveNametags(nametag, data);

  const formFills = pdfPaths
    .map(pdfPath =>
      data.map((row) => {
        const tag = row[nametag];
        const filename = `${path.parse(pdfPath).name}_${tag}.pdf`;
        const outputPath = path.join(outputFolder, filename);
        return fillPDF(pdfPath, outputPath, row).then(() => {
          if (!quiet) {
            console.log(chalk.blue('Filled: '), filename);
          }
        });
      }),
    )
    .reduce((a, i) => a.concat(i), []);

  return Promise.all(formFills);
}

async function fillFromCSV({ pdfPaths, csvPath, outputFolder, nametag, quiet }) {
  const { labels, data } = await parseCSV(csvPath);
  await fillPDFs({
    pdfPaths,
    outputFolder,
    nametag,
    quiet,
    labels,
    data,
  });
}

function fillPDF(pdfPath, outputPath, data) {
  console.log('filling with data:', data);
  return fill(pdfPath, outputPath, data, false);
}

function verifyDataHaveNametags(nametag, data) {
  const tags = {};
  return data.every((row) => {
    if (tags[nametag]) {
      console.error(`Error: We found two rows with the same nametag: ${tags[nametag]}`);
      process.exit(1);
    }

    if (nametag in row) {
      tags[nametag] = row[nametag];
      return true;
    }
    console.error(`Error: There is a row without a nametag. row's data: ${Object.values(row)}`);
    process.exit(1);
  });
}

async function ensureFolderExists(folderPath) {
  return mkdir(folderPath).catch((error) => {
    if (error.code === 'EEXIST') return Promise.resolve();
    throw error;
  });
}

module.exports = {
  fillPDF: curry(fillPDF),
  fillPDFs,
  fillFromCSV,
};
