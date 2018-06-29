const { promisify } = require('util')
const { generateFieldJson } = require('pdffiller')

const generateFields = promisify(generateFieldJson)

async function validateForm(formPath, labels) {
  const fields = await generateFields(formPath, null)
  if (fields.length <= 0) {
    throw new Error(
      `The form at ${formPath} does not have any detectable fields. Are you sure this is a form-fillable PDF?`
    )
  }

  return verifyFormHasFields(fields, labels)
}

// Verify that each column of the CSV exists in the form
function verifyFormHasFields(fields, labels) {
  return labels.every(colName => {
    const formHasField = !!fields.find(field => field.title === colName)
    if (!formHasField) {
      throw new Error(`The form provided does not have a field for: ${colName}`)
    }
    return formHasField
  })
}

module.exports = {
  validateForm,
  listFields: pdfPath => generateFields(pdfPath, null),
}
