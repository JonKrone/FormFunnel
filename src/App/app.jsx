const React = require('react')
const cn = require('classnames')
const { parse, join } = require('path')
const { shell, remote } = require('electron')
const unhandled = require('electron-unhandled')
const { Scrollbars } = require('react-custom-scrollbars')

const {
  loadFromGSheets,
  labelRows,
} = require('./../GoogleSheets/load-from-gsheets')
const { fillPDFs } = require('./../fill-form')
const store = require('./store')
const createLogger = require('./../logs/gcp-datastore')
const ErrorBoundary = require('./ErrorBoundary')

const { dialog, getCurrentWindow } = remote
const log = createLogger(store)
window.log = log
window.store = store

unhandled({
  logger: error => {
    log({
      type: 'unhandled-error',
      error,
    })
  },
})

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      labels: [],
      data: [],
      rows: [],
      selectedRow: [],
      selectedPDFs: [],
      outputRoot: store.get('outputRoot'),
    }
    this.selectRow = this.selectRow.bind(this)
    this.fillEm = this.fillEm.bind(this)
    this.addPDF = this.addPDF.bind(this)
    this.removePDF = this.removePDF.bind(this)
    this.showFolderSelect = this.showFolderSelect.bind(this)
    this.filterRows = debounceFilter(this.filterRows.bind(this))
  }

  componentWillMount() {
    loadFromGSheets().then(({ labels, rows }) => {
      log({ type: 'gsheet-load' })
      rows.reverse() // most-recent first
      this.setState({ isLoading: false, labels, data: rows, rows })
    })
  }

  selectRow(selectedIdx) {
    const rowData = this.state.rows[selectedIdx]
    const isDeselecting = this.state.selectedRow === rowData
    const selectedRow = isDeselecting ? [] : rowData
    const utility = selectedRow[3]
    const selectedPDFs = isDeselecting
      ? []
      : store.get('utilityToPDFs')[utility] || []

    this.setState({
      selectedIdx,
      selectedRow,
      selectedPDFs,
    })

    log({
      type: 'row-select',
      idx: selectedIdx,
    })
  }

  fillEm() {
    if (this.state.selectedRow.length <= 0) {
      console.warn('Please select a row!')
      return
    }

    if (!this.state.outputRoot) {
      const win = getCurrentWindow()
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Where should we save the PDFs?',
        message:
          "Please use the 'Add an output folder' button to select the root folder where we'll place the PDFs.\n\nFor example: C/Users/David will place files in C/Users/David/<salesperson>/<customer>",
      })
      return
    }

    const pdfs = this.state.selectedPDFs
    const data = [this.state.selectedRow]
    const labeledData = labelRows(this.state.labels, data)[0]
    const outputFolder = join(
      this.state.outputRoot,
      labeledData.Salesperson,
      labeledData['Customer Name']
    )

    fillPDFs({
      pdfPaths: pdfs,
      data: [labeledData],
      outputFolder,
      quiet: true,
    })
      .then(filled => {
        shell.showItemInFolder(filled[0])
        log({
          type: 'fill-pdf',
          done: true,
        })
      })
      .catch(err => {
        log({
          type: 'fill-pdf',
          error: err,
          done: true,
        })

        if (err.message.match(/spawn pdftk ENOENT/)) {
          showMissingPdftkMessage()
          return
        }
        throw err
      })

    log({
      type: 'fill-pdf',
      done: false,
      outputFolder,
      pdfCount: pdfs.length,
    })
  }

  addPDF() {
    log({
      type: 'add-pdf',
      action: 'open',
      utility: this.state.selectedRow[3],
    })
    dialog.showOpenDialog(
      {
        title: 'Select fillable PDFs',
        filters: [
          { name: 'PDFs', extensions: ['pdf', 'fdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile', 'multiSelections'],
      },
      selectedPDFs => {
        if (!selectedPDFs) {
          log({
            type: 'add-pdf',
            action: 'cancel',
            utility: this.state.selectedRow[3],
          })
          return
        }

        if (this.state.selectedPDFs.includes(selectedPDFs[0])) {
          return
        }

        this.setState(
          { selectedPDFs: this.state.selectedPDFs.concat(selectedPDFs) },
          () => {
            store.set(
              `utilityToPDFs.${this.state.selectedRow[3]}`,
              this.state.selectedPDFs
            )
          }
        )

        log({
          type: 'add-pdf',
          action: 'close',
          utility: this.state.selectedRow[3],
          selectedCount: selectedPDFs.length,
        })
      }
    )
  }

  removePDF(path) {
    const utility = this.state.selectedRow[3]
    const selectedPDFs = this.state.selectedPDFs.filter(
      pdfPath => pdfPath !== path
    )
    this.setState(
      {
        selectedPDFs,
      },
      () => {
        store.set(`utilityToPDFs.${utility}`, selectedPDFs)
      }
    )

    log({
      type: 'remove-pdf',
      utility: utility,
    })
  }

  showFolderSelect() {
    log({
      type: 'output-folder',
      action: 'open',
    })
    dialog.showOpenDialog(
      { title: 'Where to save created PDF', properties: ['openDirectory'] },
      folder => {
        if (!folder) {
          log({
            type: 'output-folder',
            action: 'cancel',
          })
          return
        }
        this.setState({ outputRoot: folder[0] })
        store.set('outputRoot', folder[0])
        log({
          type: 'output-folder',
          action: 'close',
        })
      }
    )
  }

  filterRows(value) {
    const data = this.state.data
    const rows = data.filter(
      row => !!row.find(col => col.toLowerCase().includes(value))
    )
    this.setState({
      rows,
    })

    log({
      type: 'filter-rows',
    })
  }

  render() {
    const {
      isLoading,
      labels,
      rows,
      selectedRow,
      selectedPDFs,
      outputRoot,
    } = this.state
    if (isLoading) {
      return (
        <div className="loading-msg flex flex-column items-center justify-center f1">
          Loading . . .
        </div>
      )
    }
    return (
      <ErrorBoundary>
        <div className="mt2 flex flex-row">
          <div className="w-two-thirds flex-column items-baseline">
            <input
              className="mv2 mh3 pv2 ph3 ba br2"
              type="text"
              placeholder="Filter"
              onChange={this.filterRows}
              autoFocus
            />
            <div className="sheets-table__cont pr3 br2 overflow-auto">
              <Scrollbars>
                <table className="sheets-table mh3 collapse ba b--black-10">
                  <TableHeader labels={labels} />
                  <TableRows
                    rows={rows}
                    selectedRow={selectedRow}
                    selectRow={this.selectRow}
                  />
                </table>
              </Scrollbars>
            </div>
          </div>
          <ActionPanel
            selectedPDFs={selectedPDFs}
            outputRoot={outputRoot}
            addPDF={this.addPDF}
            removePDF={this.removePDF}
            fillEm={this.fillEm}
            showFolderSelect={this.showFolderSelect}
            readyToFill={!!(selectedRow.length && selectedPDFs.length)}
          />
        </div>
      </ErrorBoundary>
    )
  }
}

function ActionPanel({
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
            pv3: !hasPDFs,
            'pt3 pb4': hasPDFs,
          },
          'f1 ph4 mv4 mb4 link br3 dib white bg-dark-blue'
        )}
        disabled={!readyToFill}
        onClick={fillEm}
      >
        Fill 'em!
      </button>
      <a
        className="grow f5 ph4 underline dark-blue pointer mb3 mt3"
        onClick={addPDF}
      >
        Add a PDF
      </a>
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
  const prettyPath = name.length > 20 ? `${name.slice(0, 20)}...` : name
  return (
    <div className="pdf w-20 flex flex-column items-center mh2 tc mw-12rem">
      <a
        className="f4 mh1 mv1 link self-end pointer dim"
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
        <a className="mt3 dark-blue fw6">{prettyPath}</a>
      </div>
    </div>
  )
}

function TableHeader({ labels }) {
  return (
    <thead>
      <tr className="striped--near-white bb bw2">
        {labels.map((label, idx) => (
          <th className="pv3 ph2 tl f7 fw6 ttu" key={`${label}+${idx}`}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

// TODO BUG: selectRow(idx) needs to select the idx of `data`, not `rows`
function TableRows({ rows, selectedRow, selectRow }) {
  return (
    <tbody>
      {rows.map((row, idx) => (
        <tr
          className={cn(
            { 'sheets-table__row--selected': selectedRow[0] === row[0] },
            'sheets-table__row striped--near-white mv1'
          )}
          onClick={() => selectRow(idx)}
          key={`${row[0]}${idx}`}
        >
          {row.map((col, i) => (
            <td className="ph2 pv2" key={`${col}${i}`}>
              {col}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

let tid
function debounceFilter(fn, ms) {
  return function(event) {
    const value = event.target.value.toLowerCase()
    clearTimeout(tid)
    tid = setTimeout(() => {
      clearTimeout(tid)
      fn(value)
    }, ms)
  }
}

function showMissingPdftkMessage() {
  const win = getCurrentWindow()

  dialog.showMessageBox(
    win,
    {
      type: 'info',
      buttons: ['Beam me up'],
      title: 'Please install pdftk',
      message:
        'Hey, looks like this is your first time using me. To work, I need a tool called PDFtk server, a little command-line app that I use internally.\n\n' +
        "After clicking the button below, use the BIG GREEN 'Windows Download' button to download the software, then go ahead and install it.\n\nPromise it's not malicious.",
    },
    () => {
      shell.openExternal('https://www.pdflabs.com/tools/pdftk-server/')
    }
  )
}
