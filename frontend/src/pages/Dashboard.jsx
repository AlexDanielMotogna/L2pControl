import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPCs, updateSession, closeSession } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import PaymentBadge from '../components/PaymentBadge'
import SessionTimer from '../components/SessionTimer'
import Modal from '../components/Modal'
import { format } from 'date-fns'

function Dashboard() {
  const queryClient = useQueryClient()
  const [editModal, setEditModal] = useState({ open: false, session: null })
  const [userName, setUserName] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  const { data: pcs, isLoading, error } = useQuery({
    queryKey: ['pcs'],
    queryFn: getPCs,
    refetchInterval: 5000,
    staleTime: 3000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, updates }) => updateSession(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pcs'] })
      setEditModal({ open: false, session: null })
    },
  })

  const closeMutation = useMutation({
    mutationFn: closeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pcs'] })
    },
  })

  const openEditModal = (session) => {
    setUserName(session.userName || '')
    setAmountPaid(session.amountPaid || '')
    setEditModal({ open: true, session })
  }

  const handleSave = () => {
    if (!editModal.session) return

    updateMutation.mutate({
      sessionId: editModal.session.id,
      updates: {
        userName: userName || null,
        amountPaid: amountPaid ? parseFloat(amountPaid) : null,
      },
    })
  }

  const handleMarkPaid = (session) => {
    updateMutation.mutate({
      sessionId: session.id,
      updates: { paidStatus: 'PAID' },
    })
  }

  const handleCloseSession = (session) => {
    if (confirm('Are you sure you want to close this session?')) {
      closeMutation.mutate(session.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-300">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-red-300">
        Error loading PCs: {error.message}
      </div>
    )
  }

  const onlinePCs = pcs?.filter(pc => pc.status === 'ONLINE').length || 0
  const totalPCs = pcs?.length || 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-300 mt-1">
          {onlinePCs} of {totalPCs} PCs online
        </p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur shadow rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                PC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Current User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Session Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/30 divide-y divide-gray-700">
            {pcs?.map((pc) => (
              <tr key={pc.id} className={pc.status === 'ONLINE' ? 'bg-green-900/20' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-white">{pc.pcId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={pc.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {format(new Date(pc.lastSeenAt), 'MMM d, HH:mm:ss')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {pc.activeSession ? (
                    <span className="text-sm text-white">
                      {pc.activeSession.userName || '—'}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {pc.activeSession ? (
                    <SessionTimer startAt={pc.activeSession.startAt} />
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {pc.activeSession ? (
                    <PaymentBadge status={pc.activeSession.paidStatus} />
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {pc.activeSession && (
                    <>
                      <button
                        onClick={() => openEditModal(pc.activeSession)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      {pc.activeSession.paidStatus === 'UNPAID' && (
                        <button
                          onClick={() => handleMarkPaid(pc.activeSession)}
                          className="text-green-400 hover:text-green-300"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleCloseSession(pc.activeSession)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Close
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!pcs || pcs.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            No PCs registered yet. Start the client on a PC to see it here.
          </div>
        )}
      </div>

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
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
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
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="0.00"
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

export default Dashboard
