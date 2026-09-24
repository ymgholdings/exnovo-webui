import { useState } from 'react';
import RoundTableCanvas from './components/RoundTableCanvas';
import { LayoutDashboard, Sword, Tv, BrainCircuit, LineChart, Shield, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quests' | 'media' | 'advanced' | 'strategy'>('dashboard');

  return (
    <div className="min-h-screen bg-[#020408] text-slate-100 flex font-mono overflow-hidden">
      {/* LEFT NAVIGATION BAR (As seen in Dashboard Overview.jpeg) */}
      <nav className="w-20 bg-[#050B14] border-r border-cyan-500/20 flex flex-col items-center py-6 gap-8 z-20">
        <div className="p-2 bg-cyan-950/80 border border-cyan-400/40 rounded-xl glow-cyan">
          <Shield className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="flex flex-col gap-6 w-full items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 w-full py-2 transition-all border-l-2 ${
              activeTab === 'dashboard' ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px]">DASHBOARD</span>
          </button>

          <button
            onClick={() => setActiveTab('quests')}
            className={`flex flex-col items-center gap-1 w-full py-2 transition-all border-l-2 ${
              activeTab === 'quests' ? 'border-amber-400 text-amber-400 bg-amber-950/30' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sword className="w-5 h-5" />
            <span className="text-[9px]">QUESTS</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex flex-col items-center gap-1 w-full py-2 transition-all border-l-2 ${
              activeTab === 'media' ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[9px]">MEDIA</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex flex-col items-center gap-1 w-full py-2 transition-all border-l-2 ${
              activeTab === 'advanced' ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <BrainCircuit className="w-5 h-5" />
            <span className="text-[9px]">ADVANCED</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex flex-col items-center gap-1 w-full py-2 transition-all border-l-2 ${
              activeTab === 'strategy' ? 'border-amber-400 text-amber-400 bg-amber-950/30' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <LineChart className="w-5 h-5" />
            <span className="text-[9px]">STRATEGY</span>
          </button>
        </div>
      </nav>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        {/* TOP BANNER */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-widest text-slate-100">
              EXNOVO AGENTIC OS: <span className="text-cyan-400">{activeTab.toUpperCase()} VIEW</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Gateway:</span>
              <span className="text-emerald-400">127.0.0.1:4000</span>
            </div>
          </div>
        </header>

        {/* ACTIVE VIEW RENDERING */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col gap-6">
            {/* Stat Counters matching Dashboard Overview.jpeg */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#080E1A] border border-cyan-500/30 p-4 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xs text-cyan-400">ACTIVE QUESTS</span>
                <span className="text-3xl font-bold text-slate-100">3</span>
              </div>
              <div className="bg-[#080E1A] border border-amber-500/30 p-4 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xs text-amber-400">TOTAL KNIGHTS</span>
                <span className="text-3xl font-bold text-slate-100">12</span>
              </div>
              <div className="bg-[#080E1A] border border-amber-500/30 p-4 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xs text-amber-400">REVENUE STRATEGY</span>
                <span className="text-2xl font-bold text-amber-300">STABLE</span>
              </div>
              <div className="bg-[#080E1A] border border-cyan-500/30 p-4 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xs text-cyan-400">SYSTEM STATUS</span>
                <span className="text-2xl font-bold text-emerald-400">OPTIMAL</span>
              </div>
            </div>

            {/* Central Viewport */}
            <div className="flex-1 min-h-[500px] border border-cyan-500/20 rounded-xl overflow-hidden relative">
              <RoundTableCanvas />
            </div>
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
            <span className="text-slate-500 text-sm">
              Module [{activeTab.toUpperCase()}] ready for GLTF Mesh & Shader staging.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
