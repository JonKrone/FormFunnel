import React from 'react'
import { join } from 'path'
import { shell, remote, webFrame } from 'electron'
import unhandled from 'electron-unhandled'

import { loadFromGSheets, labelRows } from './core/load-from-gsheets'
import { fillPDFs } from './../fill-form'
import store from './core/store'
import createLogger from './core/logger'
import ErrorBoundary from './components/ErrorBoundary'
import DataTable from './components/DataTable'
import ActionPanel from './components/ActionPanel'

const { dialog, getCurrentWindow } = remote
const log = createLogger(store)

unhandled({
  logger: error => {
    log({
      type: 'unhandled-error',
      error,
    })
  },
})

// Shhh. (simpler than changing base font/everything sizes)
webFrame.setZoomFactor(0.9)

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
    this.refreshData = this.refreshData.bind(this)
    this.filterRows = debounceFilter(this.filterRows.bind(this))
  }

  componentWillMount() {
    this.refreshData()
  }

  refreshData() {
    loadFromGSheets().then(({ labels, rows }) => {
      log({ type: 'gsheet-load' })

      rows = rows.filter(row => row[0] !== '') // only data-filled rows
      rows.reverse() // most-recent first

      this.setState({ isLoading: false, labels, data: rows, rows })
    })

    this.setState({ isLoading: true })
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
      displayModal({
        title: 'Where should we save the PDFs?',
        message:
          "Please use the 'Add an output folder' button to select the root folder where we'll place the PDFs.\n\nFor example: C/Users/David will place files in C/Users/David/<salesperson>/<customer>",
      })
      return
    }

    const pdfs = this.state.selectedPDFs
    const labeledData = labelRows(this.state.labels, [this.state.selectedRow])
    const client = labeledData[0]
    const customerPath = join(client.Salesperson, client['Customer Name'])
    const outputFolder = join(this.state.outputRoot, customerPath)

    fillPDFs({
      pdfPaths: pdfs,
      data: labeledData,
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

        if (err.message.match(/does not exist/)) {
          displayModal({
            message: `Create the folder for ${customerPath}`,
          })
          return
        } else if (err.message.match(/spawn pdftk ENOENT/)) {
          displayModal({
            buttons: ['Beam me up'],
            message:
              "Hey, looks like this is your first time using me. To work, I need a tool called PDFtk server, a little command-line app that I use internally.\n\nAfter clicking the button below, use the BIG GREEN 'Windows Download' button to download the software, then go ahead and install it.\n\nPromise it's not malicious.",
          }).then(() => {
            shell.openExternal('https://www.pdflabs.com/tools/pdftk-server/')
          })
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
          { name: 'All Files', extensions: ['*'] }
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
      utility,
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
          action: 'select',
        })
      }
    )
  }

  filterRows(value) {
    // This is a bit naive and expensive. Should migrate to a worker
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
      const loadingClasses =
        'loading-msg flex flex-column items-center justify-center f1'
      return <div className={loadingClasses}>Loading . . .</div>
    }

    return (
      <ErrorBoundary>
        <div className="mt2 flex flex-row">
          <DataTable
            labels={labels}
            rows={rows}
            selectedRow={selectedRow}
            selectRow={this.selectRow}
            filterRows={this.filterRows}
            refreshData={this.refreshData}
          />
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

let tid
function debounceFilter(fn, ms) {
  return function bouncer(event) {
    const value = event.target.value.toLowerCase()
    clearTimeout(tid)
    tid = setTimeout(() => {
      clearTimeout(tid)
      fn(value)
    }, ms)
  }
}

function displayModal(options) {
  const win = getCurrentWindow()

  return new Promise(resolve => {
    dialog.showMessageBox(
      win,
      Object.assign(
        {
          type: 'info',
        },
        options
      ),
      resolve
    )
  })
}
