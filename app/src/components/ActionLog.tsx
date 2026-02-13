"use client";

import { useState } from "react";
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

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  );
}

function getBarColor(score: number): string {
  if (score <= 25) return "bg-emerald-500";
  if (score <= 50) return "bg-yellow-500";
  if (score <= 75) return "bg-orange-500";
  return "bg-red-500";
}

export default function ActionLog({ actions }: ActionLogProps) {
  const sorted = [...actions].reverse();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium">No actions taken yet</p>
          <p className="text-xs mt-1 text-gray-600">All stablecoins within safe parameters</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {sorted.map((action, i) => {
            const style = TYPE_STYLES[action.type] || TYPE_STYLES.MONITOR;
            const time = new Date(action.timestamp).toLocaleTimeString();
            const isExpanded = expandedIdx === i;
            const hasReasoning = !!action.reasoning;

            return (
              <div
                key={i}
                className={`${style.bg} border border-gray-800 rounded-lg p-3 animate-fade-in-up hover:border-gray-700 transition-all duration-200 ${hasReasoning ? "cursor-pointer" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => hasReasoning && setExpandedIdx(isExpanded ? null : i)}
              >
                <div className="flex items-start gap-3">
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
                      {hasReasoning && (
                        <span className="text-xs text-gray-600">
                          {isExpanded ? "\u25B2" : "\u25BC"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {action.reasoning?.summary || action.details}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {action.fromToken}
                        {action.toToken ? ` \u2192 ${action.toToken}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded reasoning breakdown */}
                {isExpanded && action.reasoning && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-3">
                    {/* Factor breakdown */}
                    <div className="space-y-2">
                      {action.reasoning.factors.map((factor, fi) => (
                        <div key={fi} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-28 shrink-0 truncate">
                            {factor.name}
                          </span>
                          <div className="flex-1">
                            <ScoreBar score={factor.score} color={getBarColor(factor.score)} />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">
                            {factor.score}
                          </span>
                          <span className="text-xs text-gray-600 w-10 text-right">
                            {Math.round(factor.weight * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Detail lines */}
                    <div className="space-y-1">
                      {action.reasoning.factors.map((factor, fi) => (
                        <p key={fi} className="text-xs text-gray-500">
                          <span className="text-gray-400">{factor.name}:</span> {factor.detail}
                        </p>
                      ))}
                    </div>

                    {/* Alternatives + threshold */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {action.reasoning.alternatives.map((alt, ai) => (
                        <span key={ai} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                          {alt}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      {action.reasoning.thresholdContext}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
