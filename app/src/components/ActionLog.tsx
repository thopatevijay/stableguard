"use client";

import type { AgentAction } from "../lib/types";

interface ActionLogProps {
  actions: AgentAction[];
}

const TYPE_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  ALERT: { icon: "!", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  REBALANCE: { icon: "\u21C4", color: "text-orange-400", bg: "bg-orange-500/10" },
  EMERGENCY_EXIT: { icon: "\u26A0", color: "text-red-400", bg: "bg-red-500/10" },
  MONITOR: { icon: "\u25CB", color: "text-gray-400", bg: "bg-gray-500/10" },
};

export default function ActionLog({ actions }: ActionLogProps) {
  const sorted = [...actions].reverse();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Agent Actions
        {actions.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({actions.length})
          </span>
        )}
      </h3>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No actions taken yet</p>
          <p className="text-xs mt-1">All stablecoins within safe parameters</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {sorted.map((action, i) => {
            const style = TYPE_STYLES[action.type] || TYPE_STYLES.MONITOR;
            const time = new Date(action.timestamp).toLocaleTimeString();
            return (
              <div
                key={i}
                className={`${style.bg} border border-gray-800 rounded-lg p-3 flex items-start gap-3`}
              >
                <div
                  className={`${style.color} w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-current/20`}
                >
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-medium ${style.color}`}>
                      {action.type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-500">{time}</span>
                    <span className="text-xs text-gray-600 ml-auto">
                      Risk: {action.riskScore}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{action.details}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {action.fromToken}
                      {action.toToken ? ` \u2192 ${action.toToken}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
