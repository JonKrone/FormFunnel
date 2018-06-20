const yargs = require('yargs');
const { fillPDFs } = require('./index');
const path = require('path');
const { green } = require('chalk');

const { listFields } = require('./validate-form');
const loadFromGSheets = require('./GoogleSheets/load-from-gsheets');

yargs
  .usage('pdfFiller: Your handy dandy tool to fill a bunch of PDFs with CSV data!')
  .command({
    command: 'listFields <pdfPath>',
    description: 'List the names of fields in a PDF',
    handler({ pdfPath }) {
      listFields(pdfPath).then((fields) => {
        console.log(green('\nPDF:\t'), path.basename(pdfPath));
        console.log(green('Fields:'));
        fields.forEach(({ title }) => console.log('\t', title));
      });
    },
  })
  .command({
    command: 'loadFromGSheets [clientID]',
    description: "Read the data for a specific client from David's Index Sheet",
    builder: {
      clientID: {
        type: 'string',
        describe: 'The ID off the client to retrieve data from',
        required: true,
      },
    },
    handler({ clientID }) {
      loadFromGSheets(clientID);
    },
  })
  .command({
    command: 'fill [csvPath] [pdfPath] [outputFolder]',
    description: 'Create a filled pdf from each row of data in the csv',
    builder: {
      csvPath: {
        type: 'string',
        describe: 'Path to the CSV where the data is held',
        required: true,
      },
      pdfPath: {
        type: 'string',
        describe: 'Path to the form-fillable PDF you want to fill',
        required: true,
      },
      outputFolder: {
        type: 'string',
        describe: 'Path to the folder you want to save the filled PDFs',
        required: true,
      },
      nametag: {
        type: 'string',
        description: 'CSV column name to use in output filename',
        required: true,
      },
      quiet: {
        type: 'boolean',
        describe: 'Less output?',
        default: false,
      },
    },
    handler: fillPDFs,
  })
  .demandCommand(1, 'Must provide a command').argv;
