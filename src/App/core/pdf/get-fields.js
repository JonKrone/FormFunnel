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
 * pdftk does not support changing the dropdown
 */

export default function getFields(pdfPath) {
  console.log('pm:', promisify(pdf.generateFieldJson))
  return promisify(pdf.generateFieldJson)(pdfPath, null)
}
