import React from 'react'
import cn from 'classnames'
import { Scrollbars } from 'react-custom-scrollbars'

export default class DataTable extends React.PureComponent {
  render() {
    const {
      labels,
      rows,
      selectedRow,
      selectRow,
      filterRows,
      refreshData
    } = this.props

    return (
      <div className="w-two-thirds flex-column items-baseline">
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
            onClick={refreshData}
          >
            <img
              className="refresh-icon"
              src="../assets/reload-2.svg"
              alt="refresh icon"
            />
          </button>
        </div>
        <div className="table__cont pr3 br2 overflow-auto">
          <Scrollbars>
            <table className="table mh3 collapse ba b--black-10">
              <TableHeader labels={labels} />
              <TableRows
                rows={rows}
                selectedRow={selectedRow}
                selectRow={selectRow}
              />
            </table>
          </Scrollbars>
        </div>
      </div>
    )
  }
}

function TableHeader({ labels }) {
  return (
    <thead>
      <tr className="table-header bb bw2">
        {labels.map((label, idx) => {
          const cutoff = 18
          const prettyLabel =
            label.length > cutoff ? `${label.slice(0, cutoff)}...` : label

          return (
            <th className="pv2 pl2 pr4 tl f7 fw6 ttu" key={`${label}+${idx}`}>
              {prettyLabel}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}

function TableRows({ rows, selectedRow, selectRow }) {
  return (
    <tbody>
      {rows.map((row, idx) => (
        <TableRow
          key={`${row[0]}${idx}`}
          isSelected={selectedRow[0] === row[0]}
          selectRow={selectRow}
          row={row}
          idx={idx}
        />
      ))}
    </tbody>
  )
}

class TableRow extends React.PureComponent {
  render() {
    const { isSelected, selectRow, row, idx } = this.props

    return (
      <tr
        className={cn(
          { 'table__row--selected': isSelected },
          'table__row striped mv1'
        )}
        onClick={() => selectRow(idx)}
      >
        {row.map((col, i) => (
          <td className="ph2 pv2" key={`${col}${i}`}>
            {col}
          </td>
        ))}
      </tr>
    )
  }
}
