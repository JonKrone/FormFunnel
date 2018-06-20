import React from 'react';
import cn from 'classnames';

import { loadFromGSheets, labelRows } from './../GoogleSheets/load-from-gsheets';
import { fillPDFs } from './../fill-form';
import ErrorBoundary from './ErrorBoundary';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { labels: [], rows: [], selectedRows: [] };
    this.selectRow = this.selectRow.bind(this);
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.fillEm = this.fillEm.bind(this);
  }

  componentWillMount() {
    loadFromGSheets().then(({ labels, rows }) => this.setState({ labels, rows: rows.slice(0, 5) }));
  }

  selectRow(idx) {
    console.log('selecting idx:', idx);
    this.setState(({ selectedRows }) => ({
      selectedRows: selectedRows.includes(idx)
        ? selectedRows.filter(row => row !== idx)
        : selectedRows.concat([idx]),
    }));
  }

  fillEm() {
    const files = this.state.selectedFiles;
    const rows = this.state.selectedRows.map(idx => this.state.rows[idx]);
    const labeledData = labelRows(this.state.labels, rows);
    console.log('labeled Data:', labeledData);
    console.log('paths:', files);

    fillPDFs({
      pdfPaths: files,
      data: labeledData,
      nametag: 'Customer Name',
      outputFolder: "C:/Projects/professional/FormFunnel/src/App",
    })
  }

  handleFileSelect(e) {
    console.log('e?:', e.target.files);
    // Note: input.files are type FileList and not directly iterable
    const files = e.target.files;

    this.setState({
      selectedFiles: Object.keys(files).map(fileIdx => files[fileIdx].path),
    });
  }

  render() {
    const { labels, rows, selectedRows } = this.state;
    return (
      <ErrorBoundary>
        <h2>Welcome to React!</h2>
        {labels ? (
          <React.Fragment>
            <div className="fl w-50">
              <button
                className="f4 fr link grow br3 ph3 pv2 mb2 dib white bg-dark-blue"
                onClick={this.fillEm}
              >
                Fill 'em!
              </button>
              <table className="sheets-table collapse ba b--black-10">
                <thead>
                  <tr className="striped--near-white bb">
                    {labels.map((label, idx) => (
                      <th className="pv2 ph2 tl f6 fw6 ttu" key={`${label}+${idx}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      className={cn(
                        { 'sheets-table__row--selected': selectedRows.includes(idx) },
                        'sheets-table__row striped--near-white mv1',
                      )}
                      onClick={() => this.selectRow(idx)}
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
              </table>
            </div>
            <div className="fl w-50">
              <input
                type="file"
                ref="files"
                multiple
                accept=".pdf, .fdf"
                onChange={(...args) => this.handleFileSelect(...args)}
                className="bg-dark-blue"
              />
            </div>
          </React.Fragment>
        ) : null}
      </ErrorBoundary>
    );
  }
}
