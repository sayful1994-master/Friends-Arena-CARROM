import React from 'react';
import { Mail, ShieldCheck, Cpu, Code2, Sparkles, CheckCircle2 } from 'lucide-react';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Developer & Architecture Credits</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/40 border border-amber-500/30 p-5 rounded-2xl shadow-xl">
          {/* Creator Portrait */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 ring-4 ring-amber-500/10">
              <img
                src="/assets/aistudio/Create_a_professional_realistic_corporate_headsho-1784622602217_8389bbdd.png"
                alt="Sayful Islam"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback if path prefix differs
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('public/')) {
                    target.src = '/public/assets/aistudio/Create_a_professional_realistic_corporate_headsho-1784622602217_8389bbdd.png';
                  }
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-neutral-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow border border-amber-300">
              LEAD
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <h3 className="text-xl font-black text-amber-300 tracking-tight">SAYFUL ISLAM</h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-xs text-neutral-300 font-semibold mt-0.5">
              Lead Game Developer & Multiplayer Systems Architect
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400/90 mt-2 font-mono">
              <Mail className="w-3.5 h-3.5" />
              <a href="mailto:sayful1994@gmail.com" className="hover:underline">
                sayful1994@gmail.com
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-md">
                Android
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-md">
                Godot 4.3
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-md">
                GDScript 2.0
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-md">
                Wi-Fi Direct / P2P
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-md">
                Bluetooth RFCOMM
              </span>
            </div>
          </div>
        </div>

        {/* Engineering Contributions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Key Architectural Contributions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-neutral-200 block">2D Physics Engine</b>
                <span className="text-neutral-400 text-[11px]">
                  Mass momentum conservation, continuous impulse collision, cushion bounce & pocket suction.
                </span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-neutral-200 block">Authoritative Rules</b>
                <span className="text-neutral-400 text-[11px]">
                  Foul resolution, penalty Due returns, Queen covering state validation & turn cycling.
                </span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-start gap-2.5">
              <Code2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-neutral-200 block">Android Native Bridges</b>
                <span className="text-neutral-400 text-[11px]">
                  Java/Kotlin plugins for off-grid Wi-Fi P2P discovery and Bluetooth Classic SPP streams.
                </span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-neutral-200 block">CI/CD APK Automation</b>
                <span className="text-neutral-400 text-[11px]">
                  GitHub Actions workflow for headless testing, export template baking & debug APK packaging.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Metadata */}
        <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center justify-between text-xs text-neutral-400">
          <span>Package: <code className="text-amber-300 font-mono">com.friendsarena.carrom</code></span>
          <span>Version: <code className="text-neutral-300 font-mono">1.0.0</code></span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl transition"
        >
          Close Credits
        </button>
      </div>
    </div>
  );
};
