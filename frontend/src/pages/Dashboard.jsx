import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPCs,
  updateSession,
  closeSession,
  getBeverages,
} from "../api/client";
import StatusBadge from "../components/StatusBadge";
import PaymentBadge from "../components/PaymentBadge";
import SessionTimer from "../components/SessionTimer";
import BeverageModal from "../components/BeverageModal";
import { format } from "date-fns";
import { useWebSocket } from "../hooks/useWebSocket";
import { Refrigerator } from "lucide-react";

function Dashboard() {
  const { isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const [isBeverageModalOpen, setIsBeverageModalOpen] = useState(false);

  const {
    data: pcs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pcs"],
    queryFn: getPCs,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: 10000,  // Poll every 10 seconds as fallback
  });

  const { data: beverages } = useQuery({
    queryKey: ["beverages"],
    queryFn: getBeverages,
  });

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, updates }) => updateSession(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pcs"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: closeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pcs"] });
    },
  });

  const handleMarkPaid = (session) => {
    updateMutation.mutate({
      sessionId: session.id,
      updates: { paidStatus: "PAID" },
    });
  };

  const handleCloseSession = (session) => {
    if (confirm("Are you sure you want to close this session?")) {
      closeMutation.mutate(session.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-red-300">
        Error loading PCs: {error.message}
      </div>
    );
  }

  const onlinePCs = pcs?.filter((pc) => pc.status === "ONLINE").length || 0;
  const totalPCs = pcs?.length || 0;

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
              <tr
                key={pc.id}
                className={pc.status === "ONLINE" ? "bg-green-900/20" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-white">{pc.pcId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={pc.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {format(new Date(pc.lastSeenAt), "MMM d, HH:mm:ss")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {pc.activeSession ? (
                    <span className="text-sm text-white">
                      {pc.activeSession.userName || "—"}
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
                      {pc.activeSession.paidStatus === "UNPAID" && (
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

      {/* Beverage Inventory Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Refrigerator className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Fridge Inventory</h2>
          </div>
          <button
            onClick={() => setIsBeverageModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition"
          >
            Manage Inventory
          </button>
        </div>

        <div className="bg-gray-800/50 backdrop-blur shadow rounded-lg overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Beverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stock (Actual/Expected)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/30 divide-y divide-gray-700">
              {beverages?.map((beverage) => {
                const missing = (beverage.expectedStock || 0) - beverage.quantity;
                const isMissing = missing > 0;
                return (
                  <tr
                    key={beverage.id}
                    className={`hover:bg-gray-800/50 transition ${isMissing ? 'bg-yellow-500/5' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">
                        {beverage.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${isMissing ? 'text-yellow-400' : 'text-green-400'}`}>
                        {beverage.quantity} / {beverage.expectedStock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      €{beverage.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isMissing ? (
                        <span className="text-yellow-400 font-medium">{missing} missing</span>
                      ) : (
                        <span className="text-green-400">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {beverages?.length > 0 && (
                <tr className="bg-red-900/20 font-bold">
                  <td className="px-6 py-4 text-white">TOTAL</td>
                  <td className="px-6 py-4 text-green-400">
                    {beverages.reduce((sum, b) => sum + b.quantity, 0)} / {beverages.reduce((sum, b) => sum + (b.expectedStock || 0), 0)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4">
                    {beverages.reduce((sum, b) => sum + Math.max(0, (b.expectedStock || 0) - b.quantity), 0) > 0 ? (
                      <span className="text-yellow-400">{beverages.reduce((sum, b) => sum + Math.max(0, (b.expectedStock || 0) - b.quantity), 0)} missing</span>
                    ) : (
                      <span className="text-green-400">All OK</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {(!beverages || beverages.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              No beverages in inventory. Click "Manage Inventory" to add items.
            </div>
          )}
        </div>
      </div>

      <BeverageModal
        isOpen={isBeverageModalOpen}
        onClose={() => setIsBeverageModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
