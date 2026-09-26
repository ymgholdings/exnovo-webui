import React from 'react';
import RoundTableCanvas from './components/RoundTableCanvas';
import RevenueEngineCanvas from './components/RevenueEngineCanvas';

export function App() {
  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col p-4 md:p-6 gap-5">
      {/* HUD Header */}
      <header className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <span className="text-cyan-400 font-bold font-sci-fi text-base">EX</span>
          </div>
          <h1 className="text-lg md:text-xl font-sci-fi font-bold tracking-wider text-cyan-400 glow-cyan-text">
            EXNOVO AGENTIC OS: <span className="text-slate-300 font-normal">ADVANCED MATERIALS & STRATEGY</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">GATEWAY: 127.0.0.1:4000</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column HUD Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left Column: Advanced Materials Lab */}
        <aside className="lg:col-span-3 hud-panel rounded-xl p-4 flex flex-col gap-4">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />

          <div className="text-xs font-sci-fi text-cyan-400 font-bold tracking-widest border-b border-cyan-500/20 pb-2">
            ADVANCED MATERIALS LAB
          </div>
          <div className="text-sm font-semibold text-slate-200">Aero-Composite Structural Net</div>

          <div className="flex-1 min-h-[200px] bg-slate-950/80 rounded-lg border border-cyan-500/20 p-3 flex flex-col justify-between font-mono">
            <div className="text-[11px] text-cyan-300">Topology Matrix: Active</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">High Density:</span>
                <span className="text-cyan-400 font-bold">65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resilience:</span>
                <span className="text-emerald-400 font-bold">High</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thermal Rate:</span>
                <span className="text-amber-400 font-bold">1.5pm</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30 text-xs font-mono space-y-1">
            <div className="text-cyan-400 font-bold font-sci-fi">PROPERTIES</div>
            <div className="text-slate-300">Format: Taxe Node Grid</div>
            <div className="text-slate-300">Status: Nominal</div>
          </div>
        </aside>

        {/* Center Column: Round Table Holographic Viewport */}
        <main className="lg:col-span-6 flex flex-col min-h-[580px]">
          <RoundTableCanvas />
        </main>

        {/* Right Column: Revenue Strategy Engine */}
        <aside className="lg:col-span-3 hud-panel-gold rounded-xl p-4 flex flex-col gap-4">
          <div className="hud-corner hud-corner-tl" style={{ borderColor: '#ffd700' }} />
          <div className="hud-corner hud-corner-tr" style={{ borderColor: '#ffd700' }} />
          <div className="hud-corner hud-corner-bl" style={{ borderColor: '#ffd700' }} />
          <div className="hud-corner hud-corner-br" style={{ borderColor: '#ffd700' }} />

          <div className="text-xs font-sci-fi text-amber-400 font-bold tracking-widest border-b border-amber-500/20 pb-2 glow-gold-text">
            REVENUE STRATEGY ENGINE
          </div>

          <div className="text-xs font-mono text-amber-200">
            QUEST: ECONOMIC SaaS DEV PLATFORM
          </div>

          {/* 3D Isometric Bar Graph Viewport */}
          <RevenueEngineCanvas />

          <div className="p-3 bg-slate-950/80 rounded-lg border border-amber-500/30 text-xs font-mono">
            <div className="text-amber-400 font-bold font-sci-fi">Sir Lancelot Analysis</div>
            <div className="text-slate-300 text-[11px] mt-1">Market Data: Predictive growth trend active.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
