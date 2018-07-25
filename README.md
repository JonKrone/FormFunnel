# Form Funnel

> A simple, specialized electron app for quickly filling out common Form-fillable PDFs.

We speed up your form filling by bringing data and forms together in one view and trying to be smart about which forms you want to fill.

#### **Example**

> For each house built in a township, someone at a construction company typically fills out a bunch of forms for various utilities, HOAs, certifications, internal documents, etc.
>
> With this app you just load that data via Google Sheets, Excel, or CSV then add your PDFs and press `Fill 'em` to complete the forms.

## Functionality:

- Link a Google Sheets document
- Select form-fillable PDFs (FDFs)
- Save form selection based on a specific column
- Fill those PDFs with selected rows from the Google Sheet
- Remember all selections so that future use is much faster

I collect crash and usage information to find bugs and improve the UX.

## Future updates:

- Automatic updates
- Continuously refine UI/UX
- More flexible data sourcing
  - Specify a Google Sheet
  - Excel
  - CSV
- Easier connection between data and a form's fields
  - A 'Form Creator' UI where you can map columns to a PDF's fields
  - A UI for displaying a form's fieldIDs
- Allow setting a strategy to remember form selections
- Allow customizing the output folder patterns
- If output dir doesn't exist, offer to create it
