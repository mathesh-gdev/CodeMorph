import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Shield, Database } from 'lucide-react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    "Initializing neural pathways...",
    "Linking AI providers...",
    "Calibrating AST parser...",
    "Syncing execution timeline...",
    "System ready. Awaiting intelligence."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + Math.random() * 15));
    }, 200);

    const statusInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statuses.length);
    }, 600);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center z-[200] overflow-hidden"
    >
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#00FFD1 1px, transparent 1px), linear-gradient(90deg, #00FFD1 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Main Spinner Core */}
      <div className="relative mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-b-2 border-accent/20"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 m-auto w-24 h-24 rounded-full border-t-2 border-accent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Cpu className="w-8 h-8 text-accent shadow-[0_0_20px_rgba(0,255,209,0.3)]" />
          </motion.div>
        </div>
      </div>

      {/* Brand */}
      <div className="text-center space-y-2 mb-12">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold tracking-[0.3em] text-accent uppercase"
        >
          CodeMorph
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="text-white text-[10px] uppercase tracking-[0.5em]"
        >
          Cognitive Logic Engine
        </motion.p>
      </div>

      {/* Progress & Status */}
      <div className="w-64 space-y-4">
        <div className="flex justify-between items-end text-[9px] uppercase tracking-widest text-[#444] font-bold">
          <motion.span key={statusIndex} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
            {statuses[statusIndex]}
          </motion.span>
          <span className="text-accent">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
          <motion.div 
            className="h-full bg-accent shadow-[0_0_10px_rgba(0,255,209,0.5)]"
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Technical Accents */}
      <div className="absolute bottom-12 left-12 flex gap-4 opacity-20">
        <Database className="w-4 h-4 text-accent" />
        <Zap className="w-4 h-4 text-accent" />
        <Shield className="w-4 h-4 text-accent" />
      </div>
      <div className="absolute top-12 right-12 text-[10px] text-[#444] font-mono select-none pointer-events-none text-right uppercase tracking-widest leading-loose">
        Protocol: Morph_v3.2<br/>
        Auth: Verified<br/>
        Region: Global_Edge
      </div>
    </motion.div>
  );
}
