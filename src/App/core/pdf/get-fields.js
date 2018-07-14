import { promisify } from 'util'
import pdf from 'pdffiller'

/**
 * Notes
 *
 * goal: create a UI to connect form fields with a column / source
 *
 * ideas:
 *  - take the form, convert all fields to a dropdown with the columns as choices
 *    - pdftk does not seem to see or accept changes to 'Choice' fieldTypes
 *    - https://stackoverflow.com/questions/3558216/populating-a-fieldtype-choice-field-with-multiple-options-using-an-fdf-via-pdft
 *  - convert the form into HTML, replace <input>-like elements, with dropdowns
 *    - poppler: https://poppler.freedesktop.org/
 *    - pdf2htmlEX: https://github.com/coolwanglu/pdf2htmlEX
 *  - ?
 *
 *
 *
 *
 * pdftk does not support changing the dropdown
 */

export default function getFields(pdfPath) {
  console.log('pm:', promisify(pdf.generateFieldJson))
  return promisify(pdf.generateFieldJson)(pdfPath, null)
  // return new Promise((res, rej) => {
  //   pdf.generateFieldJson(
  //     pdfPath,
  //     null,
  //     (data, err) => (err ? rej(err) : res(data))
  //   )
  // })
}

// getFields(
//   'C:/Projects/professional/FormFunnel/test/fixtures/dropdown-test.pdf'
// ).then(data => {
//   console.log('fieldData:', data)
// })

// const generator = require('utf8-fdf-generator').generator

// generator(
//   {
//     myField01: 'Gabriel Medina',
//     myField02: 'Ciudad Juárez, Chihuahua, México',
//   },
//   'output.fdf'
// )

pdf.fillFormWithFlatten(
  'C:/Projects/professional/FormFunnel/test/fixtures/dropdown-test.pdf',
  'C:/Projects/professional/FormFunnel/test/fixtures/test-out.pdf',
  {
    title: 'Dropdown-field',
    fieldType: 'Choice',
    fieldValue: 'column 1',
    // fieldOpt: ['done1', 'done2'],
  },
  false,
  (err, data) => {
    console.log('wrote')
    if (err) throw err
  }
)
