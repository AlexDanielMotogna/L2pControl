import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessions, updateSession } from '../api/client'
import PaymentBadge from '../components/PaymentBadge'
import Modal from '../components/Modal'
import { formatDuration } from '../components/SessionTimer'
import { format } from 'date-fns'

function Sessions() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: '',
    pcId: '',
    user: '',
    dateFrom: '',
    dateTo: '',
  })
  const [editModal, setEditModal] = useState({ open: false, session: null })
  const [editForm, setEditForm] = useState({
    userName: '',
    amountPaid: '',
    notes: '',
  })

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => getSessions(filters),
    refetchInterval: 5000,
    staleTime: 3000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, updates }) => updateSession(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setEditModal({ open: false, session: null })
    },
  })

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const openEditModal = (session) => {
    setEditForm({
      userName: session.userName || '',
      amountPaid: session.amountPaid || '',
      notes: session.notes || '',
    })
    setEditModal({ open: true, session })
  }

  const handleSave = () => {
    if (!editModal.session) return

    updateMutation.mutate({
      sessionId: editModal.session.id,
      updates: {
        userName: editForm.userName || null,
        amountPaid: editForm.amountPaid ? parseFloat(editForm.amountPaid) : null,
        notes: editForm.notes || null,
      },
    })
  }

  const handleTogglePaid = (session) => {
    const newStatus = session.paidStatus === 'PAID' ? 'UNPAID' : 'PAID'
    updateMutation.mutate({
      sessionId: session.id,
      updates: { paidStatus: newStatus },
    })
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      pcId: '',
      user: '',
      dateFrom: '',
      dateTo: '',
    })
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-red-300">
        Error loading sessions: {error.message}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Sessions History</h2>
        <p className="text-gray-300 mt-1">View and manage all sessions</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-900/50 text-white rounded-md text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              PC
            </label>
            <input
              type="text"
              value={filters.pcId}
              onChange={(e) => handleFilterChange('pcId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-900/50 text-white rounded-md text-sm focus:ring-2 focus:ring-red-500"
              placeholder="PC-01"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              User
            </label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-900/50 text-white rounded-md text-sm focus:ring-2 focus:ring-red-500"
              placeholder="Search user..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-900/50 text-white rounded-md text-sm focus:ring-2 focus:ring-red-500 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-900/50 text-white rounded-md text-sm focus:ring-2 focus:ring-red-500 [color-scheme:dark]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 text-sm text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-gray-800/50 backdrop-blur shadow rounded-lg overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-300">Loading...</div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  PC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/30 divide-y divide-gray-700">
              {sessions?.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {format(new Date(session.startAt), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-white">{session.pcId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {session.userName || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.endAt ? (
                      <span className="text-white">
                        {formatDuration(session.durationSeconds || 0)}
                      </span>
                    ) : (
                      <span className="text-blue-400 font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {session.amountPaid ? `€${session.amountPaid.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentBadge status={session.paidStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => openEditModal(session)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTogglePaid(session)}
                      className={`${
                        session.paidStatus === 'PAID'
                          ? 'text-red-500 hover:text-red-400'
                          : 'text-green-400 hover:text-green-300'
                      }`}
                    >
                      {session.paidStatus === 'PAID' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {sessions?.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            No sessions found. Adjust your filters or wait for client activity.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, session: null })}
        title="Edit Session"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Name
            </label>
            <input
              type="text"
              value={editForm.userName}
              onChange={(e) => setEditForm(prev => ({ ...prev, userName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter user name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid
            </label>
            <input
              type="number"
              step="0.01"
              value={editForm.amountPaid}
              onChange={(e) => setEditForm(prev => ({ ...prev, amountPaid: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={3}
              placeholder="Add notes..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setEditModal({ open: false, session: null })}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Sessions
