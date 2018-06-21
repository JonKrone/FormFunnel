import React from 'react';
import cn from 'classnames';
import { parse, join } from 'path';
import { shell } from 'electron';
import { groupBy } from 'ramda';

import unhandled from 'electron-unhandled';

import { loadFromGSheets, labelRows } from './../GoogleSheets/load-from-gsheets';
import { fillPDFs } from './../fill-form';
import store from './store';
import ErrorBoundary from './ErrorBoundary';

import { remote } from 'electron';

unhandled()
const { dialog } = remote;

/**
 * <selectedDir>/<salesperson>/<customer name>/<original pdf name>
 *
 * Error if <salesperson> or <customer name> doesn't exist
 *
 * signrequest.com
 *
 */

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      labels: [],
      data: [],
      rows: [],
      selectedRow: [],
      selectedPDFs: [],
      outputRoot: store.get('outputRoot'),
    };
    this.selectRow = this.selectRow.bind(this);
    this.fillEm = this.fillEm.bind(this);
    this.addPDF = this.addPDF.bind(this);
    this.removePDF = this.removePDF.bind(this);
    this.showFolderSelect = this.showFolderSelect.bind(this);
    this.filterRows = this.filterRows.bind(this);
  }

  componentWillMount() {
    loadFromGSheets().then(({ labels, rows }) => {
      rows.reverse(); // most-recent first
      this.setState({ isLoading: false, labels, data: rows, rows });
    });
  }

  selectRow(selectedIdx) {
    const rowData = this.state.data[selectedIdx];
    const isDeselecting = this.state.selectedRow === rowData;
    const selectedRow = isDeselecting ? [] : rowData;
    const utility = selectedRow[3];
    const selectedPDFs = isDeselecting ? [] : store.get('utilityToPDFs')[utility] || [];

    this.setState({
      selectedIdx,
      selectedRow,
      selectedPDFs,
    });
  }

  fillEm() {
    console.log('filling');
    if (this.state.selectedRow.length <= 0) {
      console.warn('Please select a row!');
      return;
    }
    const pdfs = this.state.selectedPDFs;
    // const rows = this.state.selectedRow.map(idx => this.state.data[idx]);
    const data = [this.state.selectedRow];
    const labeledData = labelRows(this.state.labels, data)[0];
    const outputFolder = join(
      this.state.outputRoot,
      labeledData.Salesperson,
      labeledData['Customer Name'],
    );

    fillPDFs({
      pdfPaths: pdfs,
      data: [labeledData],
      outputFolder,
    }).then((filled) => {
      shell.showItemInFolder(filled[0]);
      console.log('filled:', filled);
    });
  }

  addPDF() {
    dialog.showOpenDialog(
      {
        title: 'Select fillable PDFs',
        filters: [
          { name: 'PDFs', extensions: ['pdf', 'fdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile', 'multiSelections'],
      },
      (selectedPDFs) => {
        if (!selectedPDFs) return;
        this.setState({ selectedPDFs: this.state.selectedPDFs.concat(selectedPDFs) }, () => {
          store.set(`utilityToPDFs.${this.state.selectedRow[3]}`, this.state.selectedPDFs);
        });
      },
    );
  }

  removePDF(path) {
    const utility = this.state.selectedRow[3];
    const selectedPDFs = this.state.selectedPDFs.filter(pdfPath => pdfPath !== path);
    this.setState(
      {
        selectedPDFs,
      },
      () => {
        store.set(`utilityToPDFs.${utility}`, selectedPDFs);
      },
    );
  }

  showFolderSelect() {
    dialog.showOpenDialog(
      { title: 'Where to save created PDF', properties: ['openDirectory'] },
      (folder) => {
        if (!folder) return;
        this.setState({ outputRoot: folder[0] });
        store.set('outputRoot', folder[0]);
      },
    );
  }

  filterRows(e) {
    const value = e.target.value.toLowerCase();
    const data = this.state.data;
    const rows = data.filter((row, idx) => !!row.find(col => col.toLowerCase().includes(value)));
    this.setState({
      rows,
    });
  }

  render() {
    const { isLoading, labels, rows, selectedRow, selectedPDFs, outputRoot } = this.state;
    return (
      <ErrorBoundary>
        {labels ? (
          <React.Fragment>
            <div className="mt4 flex flex-row">
              <div className="w-two-thirds flex-column items-baseline">
                <input
                  className="mv3 mh4 pv2 ph3 ba br2"
                  type="text"
                  placeholder="Filter"
                  onChange={this.filterRows}
                  autoFocus
                />
                <div className="vh-80 ph3 br2 overflow-auto">
                  <table className="sheets-table mh3 collapse ba b--black-10">
                    <TableHeader labels={labels} />
                    <TableRows rows={rows} selectedRow={selectedRow} selectRow={this.selectRow} />
                  </table>
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
            <div className="flex items-center flex-column" />
          </React.Fragment>
        ) : <div className="is-loading flex items-center justify-center"><div className="">We're loading!</div></div>}
      </ErrorBoundary>
    );
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
  return (
    <div className="w-third action-panel">
      {!!selectedPDFs.length && (
        <div className="w-100 flex flex-wrap justify-around mv4">
          {selectedPDFs.map(path => (
            <PDFCard path={path} key={path + String(Math.random())} removePDF={removePDF} />
          ))}
        </div>
      )}
      <button
        type="button"
        className={cn(
          { disabled: !readyToFill, pointer: readyToFill },
          'f1 ph4 pv3 mv4 mb4 link br3 dib white bg-dark-blue',
        )}
        disabled={!readyToFill}
        onClick={fillEm}
      >
        Fill 'em!
      </button>
      <div>
        <a className="grow f3 ph4 underline dark-blue pointer" onClick={addPDF}>
          Add a PDF
        </a>
        <a className="grow f3 ph4 underline dark-blue pointer" onClick={showFolderSelect}>
          Change Output Folder
        </a>
        {!!outputRoot && <p className="f5 tc i">Saving to: {outputRoot}</p>}
      </div>
    </div>
  );
}

function PDFCard({ path, removePDF }) {
  return (
    <div className="w-20 flex flex-column items-center mh2 tc mw-12rem">
      <p className="f3 mh1 mv1 link self-end pointer dim" onClick={() => removePDF(path)}>
        X
      </p>
      <div
        className="flex flex-column items-center dim pointer"
        onClick={shell.openItem.bind(shell, path)}
      >
        <img className="" width="100px" height="100px" src="../assets/pdf.svg" />
        <a className="mt3 dark-blue fw6">{parse(path).name}</a>
      </div>
    </div>
  );
}

function TableHeader({ labels }) {
  return (
    <thead>
      <tr className="striped--near-white bb bw2">
        {labels.map((label, idx) => (
          <th className="pv3 ph2 tl f6 fw6 ttu" key={`${label}+${idx}`}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// TODO BUG: selectRow(idx) needs to select the idx of `data`, not `rows`
function TableRows({ rows, selectedRow, selectRow }) {
  return (
    <tbody>
      {rows.map((row, idx) => (
        <tr
          className={cn(
            { 'sheets-table__row--selected': selectedRow[0] === row[0] },
            'sheets-table__row striped--near-white mv1',
          )}
          onClick={() => selectRow(idx)}
          key={`${row[0]}${idx}`}
        >
          {row.map((col, idx) => (
            <td className="ph2 pv2" key={`${col}${idx}`}>
              {col}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function createOutputFolder(root, salesperson, customer) {
  return join(root, salesperson, customer);
}
