'use client'

import React, { useState, useEffect } from 'react'
import { getAdminUsers } from '@/app/admin-actions'
import { DataTable } from '../common/data-table'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { MoreVertical, Search } from 'lucide-react'

export function UsersTable() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const limit = 50

  useEffect(() => {
    loadUsers()
  }, [offset, search])

  async function loadUsers() {
    try {
      setLoading(true)
      const result = await getAdminUsers(limit, offset, {
        search: search || undefined
      })
      setUsers(result.users)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'name',
      label: 'Nome',
      render: (value: string) => value || '-'
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: any) => (
        <span className="px-2 py-1 bg-slate-700 rounded text-xs font-medium text-slate-300">
          {value?.name || '-'}
        </span>
      )
    },
    {
      key: 'subscription',
      label: 'Plano',
      render: (value: any) => (
        <span className="text-xs">
          {value?.plan?.name || 'Sem plano'}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Cadastro',
      render: (value: Date) => formatDistanceToNow(new Date(value), { addSuffix: true, locale: pt })
    }
  ]

  function renderActions(user: any) {
    return (
      <button className="inline-flex items-center justify-center p-2 hover:bg-slate-700 rounded-lg transition-colors">
        <MoreVertical size={16} className="text-slate-400" />
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOffset(0)
          }}
          className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
        />
      </div>

      {/* Table */}
      <DataTable<any>
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        actions={renderActions}
        pagination={{
          total,
          limit,
          offset,
          onPageChange: setOffset
        }}
      />
    </div>
  )
}
