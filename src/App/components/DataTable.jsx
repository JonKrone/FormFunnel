const React = require('react')
const cn = require('classnames')
const { Scrollbars } = require('react-custom-scrollbars')

module.exports = function DataTable({
  labels,
  rows,
  selectedRow,
  selectRow,
  filterRows,
}) {
  return (
    <div className="w-two-thirds flex-column items-baseline">
      <input
        className="mv2 mh3 pv2 ph3 ba br2"
        type="text"
        placeholder="Filter"
        onChange={filterRows}
        autoFocus
      />
      <div className="sheets-table__cont pr3 br2 overflow-auto">
        <Scrollbars>
          <table className="sheets-table mh3 collapse ba b--black-10">
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