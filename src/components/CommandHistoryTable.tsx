import React from 'react';
import { History, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { CommandExecutionResult } from '../types';

interface CommandHistoryTableProps {
  history: CommandExecutionResult[];
  onClearHistory: () => void;
}

export const CommandHistoryTable: React.FC<CommandHistoryTableProps> = ({
  history,
  onClearHistory,
}) => {
  return (
    <div
      id="command-history-panel"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-red-500" />
          <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-300">
            Command History
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
            Last {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition"
            title="Clear history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
          <p className="text-xs text-zinc-500">
            No command history yet. Speak a voice command or use Quick Controls to populate this log.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Voice Command</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-mono">
              {history.map((cmd) => (
                <tr key={cmd.id} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap text-[11px]">
                    {new Date(cmd.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-white max-w-xs truncate">
                    "{cmd.rawCommand}"
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 font-sans max-w-xs truncate">
                    {cmd.actionDescription}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {cmd.success ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">✓</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 font-semibold" title={cmd.error}>
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="text-[11px]">✗</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
