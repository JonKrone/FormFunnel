import React from 'react'
import cn from 'classnames'
// import { Scrollbars } from 'react-custom-scrollbars'
import { memoizeWith, identity } from 'ramda'

import { AutoSizer, Grid, defaultCellRangeRenderer } from 'react-virtualized'

let x = []
export default class DataTable extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      gridRef: React.createRef(),
      hoveredRowIdex: -1
    }

    this._cellRenderer = this._cellRenderer.bind(this)
    this._renderHeaderCell = this._renderHeaderCell.bind(this)
    this._renderBodyCell = this._renderBodyCell.bind(this)
    this._getLabel = this._getLabel.bind(this)
    this._getColumnWidth = this._getColumnWidth.bind(this)
    this._getDatum = this._getDatum.bind(this)
  }

  _cellRenderer({ columnIndex, key, rowIndex, style }) {
    if (rowIndex === 0) {
      return this._renderHeaderCell({ columnIndex, key, rowIndex, style })
    }
    // account for the first Grid row being the header header
    const dataRowIndex = rowIndex - 1
    return this._renderBodyCell({
      columnIndex,
      key,
      style,
      rowIndex: dataRowIndex,
    })
  }

  _renderBodyCell({ columnIndex, key, rowIndex, style }) {
    // console.log('x:', x)
    // console.log('rowIndex:', rowIndex)
    const classes = cn('cell table__row', {
      'striped-cell': rowIndex % 2 === 0,
      'hovered-row': this.state.hoveredRowIdex === rowIndex
    })

    // onMouseOver: function() {
    //   setState({
    //     hoveredColumnIndex: columnIndex,
    //     hoveredRowIndex: rowIndex,
    //   });
    //   grid.forceUpdate();
    // }

    return (
      <div
        className={classes}
        key={key}
        style={style}
        onClick={() => this.props.selectRow(rowIndex)}
        onMouseOver={event => {
          console.log('over', rowIndex)
          this.setState(
            { hoveredRowIdex: rowIndex }
          )
        }}
      >
        <div className="overflow-hidden">
          {this._getDatum({ columnIndex, rowIndex })}
        </div>
      </div >
    )
  }

  _renderHeaderCell({ columnIndex, key, rowIndex, style }) {
    return (
      <div className={'cell header-cell table-header centered-cell'} key={key} style={style}>
        {this._getLabel(columnIndex)}
      </div>
    )
  }

  _cellRangeRenderer(props) {
    console.log('cellRangeRenderer props:', props)
    const children = defaultCellRangeRenderer(props)

    return children
  }

  _getDatum({ rowIndex, columnIndex }) {
    return this.props.data[rowIndex][columnIndex]
  }

  _getLabel(index) {
    return this.props.labels[index]
  }

  _getColumnWidth({ index }) {
    return 40 + this._getLabel(index).length * 4
  }

  _noContentRenderer() {
    return <div className="no-content-cell f1">No cells</div>
  }

  render() {
    const {
      labels,
      rows,
      selectedRow,
      filterRows,
      refreshGSheets,
      data,
    } = this.props
    const {
      hoveredRowIdex
    } = this.state

    const height = 700 // just use AutoSizer, but wait until we've figured other things out first

    return (
      <div className="w-two-thirds flex-column">
        <div className="flex table-actions">
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
        <div className="table__cont pr3 br2 overflow-auto">
          <AutoSizer>
            {({ width, height }) => {
              console.log('width:', width)
              return (
                <Grid
                  ref={this.state.gridRef}
                  cellRenderer={this._cellRenderer}
                  className="body-grid"
                  columnWidth={this._getColumnWidth}
                  columnCount={labels.length}
                  height={height}
                  noContentRenderer={this._noContentRenderer}
                  overscanColumnCount={10} // this is default
                  overscanRowCount={10} // this is default
                  cellRangeRenderer={this._cellRangeRenderer}
                  rowHeight={40}
                  rowCount={data.length}
                  width={width}
                  hoveredRowIdex={hoveredRowIdex}
                />
              )
            }}
          </AutoSizer>

          {/* <Scrollbars>
            <table className="table mh3 collapse ba b--black-10">
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
      <tr className="table__header bb bw2">
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
            { 'table__row--selected': selectedRow[0] === row[0] },
            'table__row striped mv1'
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
