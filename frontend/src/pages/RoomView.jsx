import { useQuery } from "@tanstack/react-query";
import { getPCs } from "../api/client";
import { Monitor, User, Clock } from "lucide-react";
import SessionTimer from "../components/SessionTimer";

function RoomView() {
  const { data: pcs, isLoading } = useQuery({
    queryKey: ["pcs"],
    queryFn: getPCs,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  // Create 10 PC slots (5 left, 5 right)
  const allPCs = pcs || [];
  const leftPCs = Array(5)
    .fill(null)
    .map((_, i) => allPCs[i] || null);
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

    const isOccupied = pc.status === "ONLINE" && pc.activeSession;
    const isOnline = pc.status === "ONLINE";

    return (
      <div className="relative group max-w-[200px] mx-auto">
        {/* PC Monitor */}
        <div
          className={`
            relative w-full aspect-[4/3] rounded border transition-all duration-300
            ${
              isOccupied
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
                ${isOccupied ? "text-green-400" : "text-red-400"}
              `}
              strokeWidth={1.5}
            />
          </div>

          {/* Status Indicator */}
          <div className="absolute top-0.5 right-0.5">
            <div
              className={`
                w-1 h-1 rounded-full animate-pulse
                ${isOccupied ? "bg-green-500" : "bg-red-500"}
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
            ${isOccupied ? "bg-green-500 text-white" : "bg-red-500 text-white"}
          `}
          >
            {isOccupied ? "ONLINE" : "OFFLINE"}
          </div>

          {/* Session Info */}
          {isOccupied && pc.activeSession && (
            <div className="mt-1 bg-gray-800/80 backdrop-blur rounded p-1 text-left space-y-0.5">
              <div className="flex items-center text-gray-300 text-[10px]">
                <User className="w-2 h-2 mr-0.5" />
                <span className="font-medium text-white truncate">
                  {pc.activeSession.userName || "User"}
                </span>
              </div>
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
        <p className="text-gray-300 text-sm sm:text-base lg:text-lg">Real-time Gaming Center View</p>

        {/* Stats */}
        <div className="flex justify-center gap-4 sm:gap-8 mt-4 sm:mt-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-lg px-4 sm:px-6 py-2 sm:py-3">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {pcs?.filter((pc) => pc.status === "ONLINE" && pc.activeSession)
                .length || 0}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">Online</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-lg px-4 sm:px-6 py-2 sm:py-3">
            <div className="text-2xl sm:text-3xl font-bold text-red-400">
              {10 -
                (pcs?.filter((pc) => pc.status === "ONLINE" && pc.activeSession)
                  .length || 0)}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">Offline</div>
          </div>
        </div>
      </div>

      {/* Room Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto mt-6 sm:mt-12">
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 sm:p-6">
          <h3 className="text-white font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-center">
            LEGEND
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 text-center">
            <div>
              <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2 animate-pulse" />
              <div className="text-green-400 font-semibold">GREEN</div>
              <div className="text-gray-400 text-sm">
                PC Online with Session
              </div>
            </div>
            <div>
              <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-2 animate-pulse" />
              <div className="text-red-400 font-semibold">RED</div>
              <div className="text-gray-400 text-sm">PC Offline</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomView;
