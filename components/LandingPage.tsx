
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
      {/* Header Minimalista (opcional) */}
      <div className="fixed top-0 left-0 w-full p-6 flex justify-center border-b border-gray-100 bg-white/50 backdrop-blur-md z-10">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">SIGLAB AVIÁRIO</span>
      </div>

      <div className="max-w-2xl w-full space-y-8">
        {/* Logo Principal */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-[#1e293b] flex flex-wrap justify-center items-center gap-x-4">
            SIGLAB <span className="bg-gradient-to-r from-emerald-500 to-cyan-600 bg-clip-text text-transparent">AVIÁRIO</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-gray-700 tracking-tight">
            Sistema Inteligente de Gestão Laboratorial Agropecuária
          </p>
          <p className="text-sm md:text-base text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
            Controle produtivo, sanitário e zootécnico de aves com precisão, agilidade e inteligência.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <button 
            onClick={onEnter}
            className="group relative inline-flex items-center gap-3 bg-[#0f172a] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-[#1e293b] hover:scale-105 active:scale-95 shadow-2xl shadow-slate-200"
          >
            Acessar Sistema
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Rodapé da Landing */}
        <div className="pt-12">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
            DESENVOLVIDO PARA O AGRONEGÓCIO MODERNO
          </p>
        </div>
      </div>
    </div>
  );
};
