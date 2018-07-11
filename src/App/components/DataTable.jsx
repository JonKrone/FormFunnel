import React from 'react'
import cn from 'classnames'
import { Scrollbars } from 'react-custom-scrollbars'

import { AutoSizer, Grid } from 'react-virtualized'

export default class DataTable extends React.PureComponent {
  constructor(props) {
    super(props)

    this._cellRenderer = this._cellRenderer.bind(this)
    this._renderHeaderCell = this._renderHeaderCell.bind(this)
    this._renderBodyCell = this._renderBodyCell.bind(this)
    this._getHeader = this._getHeader.bind(this)
    this._getColumnWidth = this._getColumnWidth.bind(this)
    this._getDatum = this._getDatum.bind(this)

    console.log('this.props.data:', this.props.data)
  }

  _cellRenderer({ columnIndex, key, rowIndex, style }) {
    if (rowIndex === 0) {
      return this._renderHeaderCell({ columnIndex, key, rowIndex, style })
    }
    return this._renderBodyCell({ columnIndex, key, rowIndex, style })
  }

  _renderBodyCell({ columnIndex, key, rowIndex, style }) {
    console.log('rendering bodyCell:', rowIndex, columnIndex)
    return (
      <div className={'cell'} key={key} style={style}>
        {this._getDatum({ columnIndex, rowIndex: rowIndex - 1 })}
      </div>
    )
  }

  _renderHeaderCell({ columnIndex, key, rowIndex, style }) {
    console.log(
      'rendering header:',
      columnIndex,
      this.props.labels[columnIndex]
    )
    return (
      <div className={'cell header-cell centered-cell'} key={key} style={style}>
        {this._getHeader(columnIndex)}
      </div>
    )
  }

  _getDatum({ rowIndex, columnIndex }) {
    return this.props.data[rowIndex][columnIndex]
  }

  _getHeader(index) {
    return this.props.labels[index]
  }

  _getColumnWidth({ index }) {
    return 40 + this._getHeader(index).length * 3
  }

  _noContentRenderer() {
    return <div className="no-content-cell f1">No cells</div>
    throw new Error('Rendering no content! check it out!')
  }

  render() {
    const {
      labels,
      rows,
      selectedRow,
      selectRow,
      filterRows,
      refreshGSheets,
      data,
    } = this.props

    const height = 700 // just use AutoSizer, but wait until we've figured other things out first

    return (
      <div className="w-two-thirds flex-column">
        <div className="flex sheets-table__actions">
          <input
            className="mv2 mh3 pv2 ph3 ba br2"
            type="text"
            placeholder="Filter"
            onChange={filterRows}
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus
          />
          <button
            className="pointer inline-flex ma2 ba br2"
            onClick={refreshGSheets}
          >
            <img
              className="refresh-icon"
              src="../assets/refresh.svg"
              alt="refresh icon"
            />
          </button>
        </div>
        <div className="sheets-table__cont pr3 br2 overflow-auto">
          <AutoSizer disableHeight>
            {({ width }) => {
              console.log('width:', width)
              return (
                <Grid
                  cellRenderer={this._cellRenderer}
                  className="body-grid"
                  columnWidth={this._getColumnWidth}
                  columnCount={labels.length}
                  height={height}
                  noContentRenderer={this._noContentRenderer}
                  overscanColumnCount={10} // this is default
                  overscanRowCount={10} // this is default
                  rowHeight={50}
                  rowCount={data.length}
                  width={width}
                />
              )
            }}
          </AutoSizer>

          {/* <Scrollbars>
            <table className="sheets-table mh3 collapse ba b--black-10">
              <TableHeader labels={labels} />
              <TableRows
                rows={rows}
                selectedRow={selectedRow}
                selectRow={selectRow}
              />
            </table>
          </Scrollbars> */}
        </div>
      </div>
    )
  }
}

function TableHeader({ labels }) {
  return (
    <thead>
      <tr className="sheets-table__header bb bw2">
        {labels.map((label, idx) => (
          <th className="pv3 pl2 pr4 tl f7 fw6 ttu" key={`${label}+${idx}`}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableRows({ rows, selectedRow, selectRow }) {
  return (
    <tbody>
      {rows.map((row, idx) => (
        <tr
          className={cn(
            { 'sheets-table__row--selected': selectedRow[0] === row[0] },
            'sheets-table__row striped mv1'
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
