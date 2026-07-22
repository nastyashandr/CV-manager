import Table from "react-bootstrap/Table";
import { useState, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function SortIcon({ direction }) {
  if (!direction) return null;
  return <span className="ms-1">{direction === "asc" ? "▲" : "▼"}</span>;
}

function HeaderCell({ column, sort, onSort }) {
  const active = sort.key === column.key;
  return (
    <th
      role={column.sortable ? "button" : undefined}
      onClick={() => column.sortable && onSort(column.key)}
      style={{
        whiteSpace: "nowrap",
        minWidth: column.minWidth || "auto",
      }}
    >
      {column.header}
      {column.sortable && (
        <SortIcon direction={active ? sort.direction : null} />
      )}
    </th>
  );
}

function useSortedData(data, sort, columns) {
  return useMemo(() => {
    if (!sort.key) return data;
    const column = columns.find((c) => c.key === sort.key);
    const accessor = column?.sortValue || ((row) => row[sort.key]);
    const sorted = [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av === bv) return 0;
      return av > bv ? 1 : -1;
    });
    return sort.direction === "desc" ? sorted.reverse() : sorted;
  }, [data, sort, columns]);
}

export default function DataTable({
  columns,
  data,
  keyField = "id",
  onRowClick,
  selectable,
  selectedIds = new Set(),
  onSelectionChange,
  emptyMessage,
}) {
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const { t } = useLanguage();
  const sorted = useSortedData(data, sort, columns);
  const displayMessage = emptyMessage || t("noData");

  const toggleSort = (key) =>
    setSort((s) => ({
      key,
      direction: s.key === key && s.direction === "asc" ? "desc" : "asc",
    }));

  const toggleRow = (id) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.size === sorted.length
        ? new Set()
        : new Set(sorted.map((r) => r[keyField])),
    );
  };

  if (!data || data.length === 0) {
    return <p className="text-muted text-center py-4">{displayMessage}</p>;
  }

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="table-responsive">
      <Table hover className="align-middle data-table mb-0">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === sorted.length}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((c) => (
              <HeaderCell
                key={c.key}
                column={c}
                sort={sort}
                onSort={toggleSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => handleRowClick(row)}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {selectable && (
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row[keyField]) || false}
                    onChange={() => toggleRow(row[keyField])}
                  />
                </td>
              )}
              {columns.map((c) => {
                const value = row[c.key];
                return (
                  <td key={c.key} style={{ wordBreak: "break-word" }}>
                    {c.render
                      ? c.render(row)
                      : value !== undefined && value !== null
                        ? String(value)
                        : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
