import React from 'react';
import cn from 'classnames';

import { shell } from 'electron';

import { loadFromGSheets, labelRows } from './../GoogleSheets/load-from-gsheets';
import { fillPDFs } from './../fill-form';
import ErrorBoundary from './ErrorBoundary';
import utilityToPdf from './utility-to-pdf';

const { dialog } = require('electron').remote;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      labels: [],
      data: [],
      rows: [],
      selectedRows: [],
      selectedFiles: [],
      outputFolder: null,
    };
    this.selectRow = this.selectRow.bind(this);
    this.fillEm = this.fillEm.bind(this);
    this.showFormSelect = this.showFormSelect.bind(this);
    this.showFolderSelect = this.showFolderSelect.bind(this);
    this.filterRows = this.filterRows.bind(this);
  }

  componentWillMount() {
    loadFromGSheets().then(({ labels, rows }) =>
      this.setState({ labels, data: rows.slice(0, 50), rows: rows.slice(0, 50) }, () => {
        const s = new Set();
        rows.forEach(row => s.add(row[3]));
        console.log('utilities:', s);
      }),
    );
  }

  selectRow(idx) {
    this.setState(({ selectedRows }) => ({
      selectedRows: selectedRows.includes(idx)
        ? selectedRows.filter(row => row !== idx)
        : selectedRows.concat([idx]),
    }));
  }

  fillEm() {
    if (this.state.selectedRows.length <= 0) {
      console.warn('Please select a row!');
      return;
    }
    const pdfs = this.state.selectedFiles;
    const rows = this.state.selectedRows.map(idx => this.state.data[idx]);
    const labeledData = labelRows(this.state.labels, rows);

    fillPDFs({
      pdfPaths: pdfs,
      data: labeledData,
      nametag: 'Customer Name',
      outputFolder: this.state.outputFolder,
    }).then((filled) => {
      shell.showItemInFolder(filled[0]);
      console.log('filled:', filled);
    });
  }

  showFormSelect() {
    dialog.showOpenDialog(
      {
        title: 'Select fillable PDFs',
        filters: [
          { name: 'PDFs', extensions: ['pdf', 'fdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile', 'multiSelections'],
      },
      (selectedFiles) => {
        console.log('selected files:', selectedFiles);
        this.setState({ selectedFiles });
      },
    );
  }

  showFolderSelect() {
    // maybe just use a default dir
    dialog.showOpenDialog(
      { title: 'Where to save created PDF', properties: ['openDirectory'] },
      (folder) => {
        console.log('folder:', folder[0]);
        this.setState({ outputFolder: folder[0] });
      },
    );
  }

  filterRows(e) {
    const value = e.target.value;
    const data = this.state.data;
    const selectedRows = this.state.selectedRows;
    const rows = data.filter(
      (row, idx) => selectedRows.includes(idx) || !!row.find(col => col.includes(value)),
    );
    this.setState({
      rows,
    });
  }

  render() {
    const { labels, rows, selectedRows } = this.state;
    return (
      <ErrorBoundary>
        {labels ? (
          <React.Fragment>
            <div className="dib flex flex-column items-baseline">
              <input
                className="mv3 mh4 pv2 ph3 ba br2"
                type="text"
                placeholder="Filter"
                onChange={this.filterRows}
              />
              <div className="w-50 vh-80 ph3 br2 overflow-auto">
                <div className="overflow-auto">
                  <table className="sheets-table mh3 collapse ba b--black-10">
                    <TableHeader labels={labels} />
                    <TableRows rows={rows} selectedRows={selectedRows} selectRow={this.selectRow} />
                  </table>
                </div>
              </div>
              <div className="w-50 vh-80 action-panel">
                <button
                  className={'f4 fr link br3 ph3 pv2 mb2 dib white bg-dark-blue'}
                  onClick={this.showFormSelect}
                >
                  Select Forms
                </button>
                <button
                  className={'f4 fr link br3 ph3 pv2 mb2 dib white bg-dark-blue'}
                  onClick={this.showFolderSelect}
                >
                  Output Folder
                </button>
              </div>
            </div>
            <button
              className="f4 fr link br3 ph3 pv2 mb2 dib white bg-dark-blue"
              onClick={this.fillEm}
            >
              Fill 'em!
            </button>
          </React.Fragment>
        ) : null}
      </ErrorBoundary>
    );
  }
}

function TableHeader({ labels }) {
  return (
    <thead>
      <tr className="striped--near-white bb">
        {labels.map((label, idx) => (
          <th className="pv2 ph2 tl f6 fw6 ttu" key={`${label}+${idx}`}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableRows({ rows, selectedRows, selectRow }) {
  return (
    <tbody>
      {rows.map((row, idx) => (
        <tr
          className={cn(
            { 'sheets-table__row--selected': selectedRows.includes(idx) },
            'sheets-table__row striped--near-white mv1',
          )}
          onClick={() => selectRow(idx)}
          key={`${row[0]}${idx}`}
        >
          {row.map((col, idx) => (
            <td className="ph2 pv1" key={`${col}${idx}`}>
              {col}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
