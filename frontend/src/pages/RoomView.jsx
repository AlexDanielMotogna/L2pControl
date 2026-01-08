import { useQuery } from "@tanstack/react-query";
import { getPCs } from "../api/client";
import { Monitor, User, Clock, DoorOpen, Refrigerator, LayoutGrid } from "lucide-react";
import SessionTimer from "../components/SessionTimer";
import { useWebSocket } from "../hooks/useWebSocket";

function RoomView() {
  const { isConnected } = useWebSocket();

  const { data: pcs, isLoading, error } = useQuery({
    queryKey: ["pcs"],
    queryFn: getPCs,
    retry: 2, // Retry failed requests 2 times
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="text-white text-xl">Error loading room. Retrying...</div>
      </div>
    );
  }

  // Create 10 PC slots (5 left, 5 right)
  const allPCs = pcs || [];
  const leftPCs = Array(5)
    .fill(null)
    .map((_, i) => allPCs[i] || null)
    .reverse(); // Reverse order: PC05, PC04, PC03, PC02, PC01
  const rightPCs = Array(5)
    .fill(null)
    .map((_, i) => allPCs[i + 5] || null);

  const PCCard = ({ pc, slotNumber, isRight }) => {
    // If no PC data, show empty slot
    if (!pc) {
      return (
        <div className="relative group max-w-[200px] mx-auto">
          {/* PC Monitor - Empty Slot */}
          <div className="relative w-full aspect-[4/3] rounded border border-gray-600 bg-gray-900/20 transition-all duration-300">
            <div className="absolute inset-0.5 bg-gray-900 rounded flex items-center justify-center">
              <Monitor className="w-3 h-3 text-gray-600" strokeWidth={1.5} />
            </div>
            <div className="absolute top-0.5 right-0.5">
              <div className="w-1 h-1 rounded-full bg-gray-600" />
            </div>
          </div>
          <div className="mt-1 text-center">
            <h3 className="text-gray-500 font-semibold text-xs mb-0.5">
              Slot {slotNumber}
            </h3>
            <div className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold mb-0.5 bg-gray-600 text-white">
              EMPTY
            </div>
          </div>
        </div>
      );
    }

    const isOnline = pc.status === "ONLINE";
    const hasActiveSession = pc.activeSession;

    return (
      <div className="relative group max-w-[200px] mx-auto">
        {/* PC Monitor */}
        <div
          className={`
            relative w-full aspect-[4/3] rounded border transition-all duration-300
            ${
              isOnline
                ? "border-green-500 bg-green-900/20 shadow shadow-green-500/50"
                : "border-red-500 bg-red-900/20 shadow shadow-red-500/50"
            }
          `}
        >
          {/* Monitor Screen */}
          <div className="absolute inset-0.5 bg-gray-900 rounded flex items-center justify-center">
            <Monitor
              className={`
                w-3 h-3
                ${isOnline ? "text-green-400" : "text-red-400"}
              `}
              strokeWidth={1.5}
            />
          </div>

          {/* Status Indicator */}
          <div className="absolute top-0.5 right-0.5">
            <div
              className={`
                w-1 h-1 rounded-full animate-pulse
                ${isOnline ? "bg-green-500" : "bg-red-500"}
              `}
            />
          </div>
        </div>

        {/* PC Info */}
        <div className="mt-1 text-center">
          <h3 className="text-white font-semibold text-xs mb-0.5">{pc.pcId}</h3>

          {/* Status */}
          <div
            className={`
            inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold mb-0.5
            ${isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"}
          `}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>

          {/* Session Info - Show if online */}
          {isOnline && hasActiveSession && (
            <div className="mt-1 bg-gray-800/80 backdrop-blur rounded p-1 text-left">
              <div className="flex items-center text-gray-300 text-[10px]">
                <Clock className="w-2 h-2 mr-0.5" />
                <SessionTimer startAt={pc.activeSession.startAt} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 py-4 sm:py-8 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-12 text-center">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
          L2P ESPORTS ROOM
        </h1>
        <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
          Real-time Gaming Center View
          {isConnected && <span className="ml-2 text-green-400">● Live</span>}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-4 sm:gap-8 mt-4 sm:mt-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg px-4 sm:px-6 py-2 sm:py-3">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {pcs?.filter((pc) => pc.status === "ONLINE").length || 0}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">Online</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg px-4 sm:px-6 py-2 sm:py-3">
            <div className="text-2xl sm:text-3xl font-bold text-red-400">
              {10 - (pcs?.filter((pc) => pc.status === "ONLINE").length || 0)}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">Offline</div>
          </div>
        </div>
      </div>

      {/* Room Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Entrance - Top Left */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col items-center">
            <div className="border-2 sm:border-4 border-green-500 bg-gray-900/50 rounded-lg p-2 sm:p-3">
              <DoorOpen className="w-8 h-8 sm:w-12 sm:h-12 text-green-400" />
            </div>
            <div className="text-green-400 font-bold text-xs sm:text-sm text-center mt-1 sm:mt-2">ENTRANCE</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8">
          {/* Left Side - 5 PCs */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white text-center mb-2 sm:mb-3 pb-1 border-b-2 border-red-500">
              LEFT SIDE
            </h2>
            {leftPCs.map((pc, index) => (
              <PCCard
                key={pc?.id || `left-${index}`}
                pc={pc}
                slotNumber={index + 1}
                isRight={false}
              />
            ))}
          </div>

          {/* Right Side - 5 PCs */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white text-center mb-2 sm:mb-3 pb-1 border-b-2 border-red-500">
              RIGHT SIDE
            </h2>
            {rightPCs.map((pc, index) => (
              <PCCard
                key={pc?.id || `right-${index}`}
                pc={pc}
                slotNumber={index + 6}
                isRight={true}
              />
            ))}
          </div>
        </div>

        {/* Counter and Fridge - Bottom */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-4 sm:mt-6">
          {/* Fridge - Bottom Left */}
          <div className="flex flex-col items-center">
            <div className="border-2 sm:border-4 border-red-500 bg-gray-900/50 rounded-lg p-2 sm:p-3">
              <Refrigerator className="w-8 h-8 sm:w-12 sm:h-12 text-red-400" />
            </div>
            <div className="text-red-400 font-bold text-xs sm:text-sm text-center mt-1 sm:mt-2">FRIDGE</div>
          </div>

          {/* Counter - Bottom Right */}
          <div className="flex flex-col items-center">
            <div className="border-2 sm:border-4 border-yellow-500 bg-gray-900/50 rounded-lg p-2 sm:p-3">
              <LayoutGrid className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" />
            </div>
            <div className="text-yellow-400 font-bold text-xs sm:text-sm text-center mt-1 sm:mt-2">COUNTER</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomView;
