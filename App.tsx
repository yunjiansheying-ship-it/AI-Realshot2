
import React, { useEffect, useRef, useState } from 'react';
import AIProductStudio from './components/AIProductStudio';
import { Key } from 'lucide-react';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (e) {
          setHasKey(true);
        }
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Calculate normalized mouse position (-1 to 1)
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      
      // Update CSS variables for high-performance animation
      containerRef.current.style.setProperty('--mouse-x', x.toString());
      containerRef.current.style.setProperty('--mouse-y', y.toString());
    };

    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrolled = window.scrollY;
      containerRef.current.style.setProperty('--scroll-y', scrolled.toString());
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (hasKey === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <Key className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">需要配置 API Key</h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            您选择的图像生成模型（如 Gemini 3.1 Flash Image）需要使用您自己的 Google Cloud 项目 API Key（需开启计费）。
            <br /><br />
            请点击下方按钮选择或配置您的 API Key。
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/25"
          >
            配置 API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-200 relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200"
      style={{
        // Default values to prevent jumping on initial load
        '--mouse-x': '0',
        '--mouse-y': '0',
        '--scroll-y': '0',
      } as React.CSSProperties}
    >
      {/* Dynamic Sci-Fi Background Container */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden perspective-container">
        <style>{`
          .perspective-container {
            perspective: 1000px;
          }
          .parallax-layer {
            transition: transform 0.1s cubic-bezier(0.2, 0.4, 0.6, 1); /* Smooth mechanical feel */
            will-change: transform;
          }
          /* 3D Grid Floor Effect */
          .grid-plane {
            transform: 
              rotateX(calc(var(--mouse-y) * 5deg + 60deg)) /* Base tilt + mouse influence */
              rotateY(calc(var(--mouse-x) * 5deg))
              translateY(calc(var(--scroll-y) * 0.5px - 200px)) /* Parallax Scroll */
              scale(2);
            transform-origin: 50% 0%;
          }
          /* Floating Orbs Parallax */
          .orb-layer-1 {
            transform: translate(calc(var(--mouse-x) * -30px), calc(var(--mouse-y) * -30px));
          }
          .orb-layer-2 {
            transform: translate(calc(var(--mouse-x) * 40px), calc(var(--mouse-y) * 40px));
          }
        `}</style>

        {/* Layer 1: The 3D Grid Floor */}
        <div className="absolute inset-[-100%] top-[-50%] parallax-layer grid-plane opacity-20">
          <div className="w-full h-full bg-[linear-gradient(to_right,#4f46e5_1px,transparent_1px),linear-gradient(to_bottom,#4f46e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_0%,transparent_80%)]"></div>
        </div>

        {/* Layer 2: Deep Ambient Glows (Moving opposite to mouse) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full parallax-layer orb-layer-1 mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full parallax-layer orb-layer-2 mix-blend-screen"></div>

        {/* Layer 3: Floating Particles (Simulated Stars) */}
        <div className="absolute inset-0 opacity-30" style={{ transform: 'translateY(calc(var(--scroll-y) * -0.2px))' }}>
            <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
            <div className="absolute top-[30%] right-[15%] w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_5px_indigo]"></div>
            <div className="absolute bottom-[20%] left-[30%] w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_purple] animate-ping" style={{ animationDuration: '4s' }}></div>
        </div>

        {/* Vignette Overlay for focus */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/20 to-slate-950/80"></div>
      </div>
      
      <div className="relative z-10">
        <AIProductStudio onRequireKey={() => setHasKey(false)} />
      </div>
    </div>
  );
}

export default App;
