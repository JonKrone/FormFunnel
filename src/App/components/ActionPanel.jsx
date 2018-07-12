import { parse } from 'path'
import React from 'react'
import { shell } from 'electron'
import cn from 'classnames'

export default function ActionPanel({
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
      {hasPDFs && (
        <div className="pdf-list w-100 mb2 flex flex-wrap justify-around">
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
          },
          'fill-em f1 ph4 pv3 mb2 link br3 dib white bg-dark-blue'
        )}
        disabled={!readyToFill}
        onClick={fillEm}
      >
        {"Fill 'em!"}
      </button>
      <button
        className="f5 pv2 ph2 pointer inline-flex mb4 mt2 ba br3"
        onClick={addPDF}
      >
        Add a PDF
      </button>
      <button
        className="f5 ph3 pv1 pointer ba br3"
        onClick={showFolderSelect}
        role="button"
        tabIndex={0}
      >
        {outputRoot ? 'Change' : 'Add an'} output folder
      </button>
      {!!outputRoot && <p className="f7 tc i mt1">Saving to: {outputRoot}</p>}
    </div>
  )
}

function PDFCard({ path, removePDF }) {
  const name = parse(path).name
  const cutoff = 30
  const prettyPath = name.length > cutoff ? `${name.slice(0, cutoff)}...` : name
  return (
    <div className="pdf w-45 flex flex-column items-center mh2 tc mw-12rem">
      <a
        className="f4 mr4 mv1 link self-end pointer dim"
        onClick={() => removePDF(path)}
        role="button"
        tabIndex={0}
      >
        X
      </a>
      <div
        className="flex flex-column items-center dim pointer"
        onClick={() => shell.openItem(path)}
        // role="presentation"
      >
        <img
          className=""
          width="100px"
          height="100px"
          src="../assets/pdf.svg"
          alt="pdf icon"
        />
        <span className="pdf-title mt3 f6 fw6 dark-blue mw-6rem">
          {prettyPath}
        </span>
      </div>
    </div>
  )
}
