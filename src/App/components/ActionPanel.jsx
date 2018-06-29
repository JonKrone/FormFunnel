const { parse } = require('path')
const React = require('react')
const { shell } = require('electron')
const cn = require('classnames')

module.exports = function ActionPanel({
  readyToFill,
  selectedPDFs,
  addPDF,
  showFolderSelect,
  removePDF,
  fillEm,
  outputRoot,
}) {
  const hasPDFs = !!selectedPDFs.length
  return (
    <div className="w-third action-panel">
      <section className="pv3" />
      {hasPDFs && (
        <div className="pdf-list w-100 flex flex-wrap justify-around mv4">
          {selectedPDFs.map(path => (
            <PDFCard path={path} key={path} removePDF={removePDF} />
          ))}
        </div>
      )}
      <button
        type="button"
        className={cn(
          {
            disabled: !readyToFill,
            pointer: readyToFill,
            // pv3: !hasPDFs,
            // 'pt3 pb3': hasPDFs,
          },
          'f1 ph4 pv3 mb2 link br3 dib white bg-dark-blue'
        )}
        disabled={!readyToFill}
        onClick={fillEm}
      >
        {"Fill 'em!"}
      </button>
      <button
        className="f5 pv2 ph2 pointer mb4 mt2 br3 white bg-dark-blue"
        onClick={addPDF}
      >
        Add a PDF
      </button>
      <a
        className="grow f5 ph4 underline dark-blue pointer"
        onClick={showFolderSelect}
      >
        {outputRoot ? 'Change' : 'Add an'} output folder
      </a>
      {!!outputRoot && <p className="f7 tc i mt1">Saving to: {outputRoot}</p>}
    </div>
  )
}

function PDFCard({ path, removePDF }) {
  const name = parse(path).name
  const cutoff = 50
  const prettyPath = name.length > cutoff ? `${name.slice(0, cutoff)}...` : name
  return (
    <div className="pdf w-50 flex flex-column items-center mh2 tc mw-12rem">
      <a
        className="f4 mr4 mv1 link self-end pointer dim"
        onClick={() => removePDF(path)}
      >
        X
      </a>
      <div
        className="flex flex-column items-center dim pointer"
        onClick={() => shell.openItem(path)}
      >
        <img
          className=""
          width="100px"
          height="100px"
          src="../assets/pdf.svg"
          alt="pdf icon"
        />
        <a className="mt3 f6 dark-blue fw6">{prettyPath}</a>
      </div>
    </div>
  )
}
