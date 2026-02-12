"use client";

interface HeaderProps {
  isRunning: boolean;
  tickCount: number;
  programId: string;
}

export default function Header({ isRunning, tickCount, programId }: HeaderProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-lg">
            SG
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">StableGuard</h1>
            <p className="text-xs text-gray-400">Autonomous Stablecoin Risk Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Program</p>
            <a
              href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
            >
              {programId.slice(0, 8)}...{programId.slice(-4)}
            </a>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Ticks</p>
            <p className="text-sm font-mono text-white">{tickCount}</p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-300">
              {isRunning ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
