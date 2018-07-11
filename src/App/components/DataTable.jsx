import React from 'react'
import cn from 'classnames'
import { Scrollbars } from 'react-custom-scrollbars'

export default function DataTable({
  labels,
  rows,
  selectedRow,
  selectRow,
  filterRows,
  refreshData
}) {
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
            src="../assets/refresh.svg"
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
