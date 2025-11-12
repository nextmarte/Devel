'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    onPageChange: (offset: number) => void
  }
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  error,
  pagination,
  actions
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
        Erro ao carregar dados: {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-slate-700/50 rounded-lg p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-700/50 rounded-lg p-8 text-center text-slate-400">
        Nenhum resultado encontrado
      </div>
    )
  }

  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1
  const hasNextPage = pagination ? currentPage < totalPages : false
  const hasPrevPage = pagination ? currentPage > 1 : false

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className={`px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider ${col.width || ''}`}>
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-slate-700/30 transition-colors">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {col.render
                      ? col.render((row as any)[col.key as string], row)
                      : String((row as any)[col.key as string] || '-')}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} resultados
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={!hasPrevPage}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-slate-300 transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-300">
              Página {currentPage} de {totalPages}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.offset + pagination.limit)}
              disabled={!hasNextPage}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-slate-300 transition-colors"
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
