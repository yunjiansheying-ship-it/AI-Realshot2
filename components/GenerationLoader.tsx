
import React from 'react';
import { BrainCircuit, Sparkles, Loader2, ScanLine } from 'lucide-react';

interface GenerationLoaderProps {
  status: 'loading' | 'analyzing' | 'completed' | 'error';
}

const GenerationLoader: React.FC<GenerationLoaderProps> = ({ status }) => {
  if (status === 'completed' || status === 'error') return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md z-10 overflow-hidden">
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 4s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {status === 'analyzing' ? (
        // ANALYZING STATE: Tech/Grid/Scan look
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
          
          {/* Scanning Line */}
          <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_10px_rgba(45,212,191,0.5)] animate-scan z-0"></div>

          <div className="relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="bg-slate-900 p-3 rounded-2xl shadow-lg border border-teal-500/30 relative">
                <BrainCircuit className="w-8 h-8 text-teal-400 animate-pulse" />
              </div>
              {/* Decor elements */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full animate-ping"></div>
            </div>
            
            <div className="mt-4 flex flex-col items-center">
              <h4 className="text-sm font-bold text-teal-300 tracking-wide flex items-center">
                <ScanLine className="w-3 h-3 mr-2 animate-pulse" />
                AI 视觉分析中
              </h4>
              <p className="text-[10px] text-teal-500 mt-1 font-mono">SCANNING_GEOMETRY...</p>
            </div>
          </div>
        </div>
      ) : (
        // LOADING / GENERATING STATE: Magic/Creative/Orbital look
        <div className="relative w-full h-full flex flex-col items-center justify-center">
           {/* Center Glow */}
           <div className="absolute w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse-glow"></div>
           
           <div className="relative z-10">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 border-l-indigo-300 opacity-80 animate-spin-slow shadow-[0_0_10px_rgba(99,102,241,0.3)]"></div>
                {/* Inner Ring */}
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-r-purple-300 opacity-80 animate-spin-reverse"></div>
                
                {/* Center Icon */}
                <div className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-full shadow-lg relative z-20 border border-white/10">
                  <Sparkles className="w-6 h-6 text-indigo-400 fill-indigo-400/20" />
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center text-center">
                <h4 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 tracking-wide">
                  正在绘制像
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GenerationLoader;
