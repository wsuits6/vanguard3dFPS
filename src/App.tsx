import { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';
import { Crosshair, Shield, Zap, Play, Loader2 } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hud, setHud] = useState({ health: 100, ammo: 30 });

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      const game = new Game(containerRef.current);
      game.onUpdateHUD = (health, ammo) => {
        setHud({ health: Math.round(health), ammo });
      };
      game.onLoadingProgress = (progress) => {
        setLoadingProgress(progress);
      };
      gameRef.current = game;
    }
  }, []);

  const handleStart = () => {
    if (gameRef.current && loadingProgress === 1) {
      gameRef.current.start();
      setIsStarted(true);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Game Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Crosshair */}
      {isStarted && hud.health > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div className="w-6 h-6 border border-emerald-400/30 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* HUD */}
      {isStarted && hud.health > 0 && (
        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end pointer-events-none">
          {/* Health */}
          <div className="group">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex items-center gap-5 min-w-[240px] shadow-2xl transition-transform hover:scale-105">
              <div className="bg-emerald-500/20 p-4 rounded-2xl shadow-inner">
                <Shield className="text-emerald-400 w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">Vitality</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-4xl font-mono font-bold leading-none">{hud.health}</span>
                  <span className="text-white/20 text-sm font-mono">%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]" 
                    style={{ width: `${hud.health}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ammo */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex items-center gap-5 min-w-[240px] shadow-2xl transition-transform hover:scale-105">
            <div className="bg-amber-500/20 p-4 rounded-2xl shadow-inner">
              <Zap className="text-amber-400 w-7 h-7" />
            </div>
            <div className="text-right flex-1">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">Tactical Load</div>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-white text-4xl font-mono font-bold leading-none">{hud.ammo}</span>
                <span className="text-white/20 text-xl font-mono">/ 30</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Menu Overlay */}
      {!isStarted && (
        <div className="absolute inset-0 bg-[#050505] flex items-center justify-center z-50">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-lg w-full p-12 text-center relative">
            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
              Next-Gen WebGL Engine
            </div>
            <h1 className="text-8xl font-black text-white mb-4 tracking-tighter italic leading-tight">
              VANGUARD<span className="text-emerald-500">.</span>
            </h1>
            <p className="text-white/30 mb-16 text-lg font-medium tracking-wide">High-Fidelity Tactical Combat Simulation</p>
            
            {loadingProgress < 1 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 text-white/60 font-mono text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  SYNCHRONIZING ASSETS... {Math.round(loadingProgress * 100)}%
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${loadingProgress * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button 
                onClick={handleStart}
                className="group relative w-full overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-emerald-500 transition-transform duration-500 group-hover:scale-105" />
                <div className="relative py-6 flex items-center justify-center gap-4 text-black font-black text-xl tracking-widest">
                  <Play className="fill-current w-6 h-6" />
                  ENGAGE MISSION
                </div>
              </button>
            )}

            <div className="mt-20 grid grid-cols-2 gap-6 text-left">
              <div className="group">
                <div className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mb-3 group-hover:text-emerald-500/50 transition-colors">Navigation</div>
                <div className="text-white/60 text-xs font-mono bg-white/5 p-3 rounded-xl border border-white/5">W, A, S, D + SHIFT</div>
              </div>
              <div className="group">
                <div className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mb-3 group-hover:text-emerald-500/50 transition-colors">Combat</div>
                <div className="text-white/60 text-xs font-mono bg-white/5 p-3 rounded-xl border border-white/5">MOUSE 1 TO FIRE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Death Screen */}
      {hud.health <= 0 && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[60]">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Shield className="text-red-500 w-10 h-10" />
            </div>
            <h2 className="text-7xl font-black text-white mb-4 italic tracking-tighter">UNIT OFFLINE</h2>
            <p className="text-red-500/40 mb-16 text-sm font-bold uppercase tracking-[0.5em]">Critical System Failure in Sector 7</p>
            <button 
              onClick={() => window.location.reload()}
              className="group relative px-16 py-5 bg-white text-black rounded-2xl font-black text-sm tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all duration-500"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
