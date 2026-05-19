import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, RotateCcw, ChevronLeft, ChevronRight, Settings, 
  Github, Copy, Download, Zap, Shield, Microscope, 
  Cpu, GraduationCap, FileCode, Search,
  CheckCircle2, TrendingUp, Layers, RefreshCw, AlertTriangle
} from 'lucide-react';
import { fetchAnalysis, ExplainMode, AnalysisResult } from './services/geminiService';
import { analyzeStructure } from './lib/parser';
import { cn } from './lib/utils';
import ProviderSettings from './components/ProviderSettings';
import LoadingScreen from './components/LoadingScreen';
import { AppSettings, DEFAULT_SETTINGS, ProviderState } from './constants/providers';

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<ExplainMode>(ExplainMode.INTERMEDIATE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [view, setView] = useState<'explanation' | 'insights' | 'docs' | 'timeline'>('explanation');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('MORPH_SETTINGS');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [switchingProvider, setSwitchingProvider] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('MORPH_SETTINGS', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Artificial delay for catchy loading effect
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setSwitchingProvider(null);
    try {
      const metadata = analyzeStructure(code);
      const result = await fetchAnalysis(code, mode, metadata, settings, (pId) => {
        setSwitchingProvider(pId);
      });
      setAnalysis(result);
      setCurrentIndex(0);
      setView('explanation');
    } catch (error: any) {
      alert(error.message || "Intelligence gathering failed. Check provider configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGithubImport = async () => {
    const url = prompt("Enter GitHub File URL (Raw or Blob):");
    if (!url) return;
    
    let target = url;
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      target = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    try {
      const res = await fetch(target);
      const text = await res.text();
      setCode(text);
    } catch (e) {
      alert("Failed to import from GitHub");
    }
  };

  const copyDoc = () => {
    if (!analysis) return;
    const doc = `
# Code Intelligence Report
## Overview
${analysis.overview}

## Architectural Observations
${analysis.architecturalObservations.map(o => `- ${o}`).join('\n')}

## Line-by-Line Breakdown
${analysis.steps.map(s => `### Line ${s.lineNumber}: \`${s.code}\`
**Intent:** ${s.intent}
**Explanation:** ${s.explanation}
**Risk:** ${s.riskLevel}
${s.optimizationSuggestion ? `**Optimization:** ${s.optimizationSuggestion}` : ''}
`).join('\n')}
    `;
    navigator.clipboard.writeText(doc);
    alert("Documentation copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-[#e0e0e0] font-mono overflow-hidden">
      <AnimatePresence>
        {isInitialLoading && <LoadingScreen />}
      </AnimatePresence>

      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-[#222] flex justify-between items-center bg-linear-to-r from-[#0d0d0d] to-[#141414] z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center border border-accent/30 shrink-0">
            <Cpu className="w-5 h-5 text-accent" />
          </div>
          <div className="text-lg md:text-xl font-bold tracking-tighter text-accent uppercase whitespace-nowrap">
            CodeMorph <span className="text-[#e0e0e0] opacity-30 font-light ml-1 hidden sm:inline">// AI Intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 max-w-[60%] justify-end">
          <button 
            onClick={handleGithubImport}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-[#666] hover:text-[#e0e0e0] transition-colors whitespace-nowrap"
          >
            <Github className="w-4 h-4" /> Import GitHub
          </button>
          
          <div className="hidden lg:block h-4 w-[1px] bg-[#222]" />

          <div className="hidden md:flex gap-1 overflow-x-auto no-scrollbar">
            {(Object.values(ExplainMode) as ExplainMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 text-[10px] rounded transition-all uppercase tracking-wider border whitespace-nowrap",
                  mode === m 
                    ? "bg-accent/10 border-accent/50 text-accent" 
                    : "border-transparent text-[#666] hover:text-[#999]"
                )}
              >
                {m.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Mobile Mode Selector */}
          <div className="md:hidden">
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as ExplainMode)}
              className="bg-[#141414] border border-[#222] text-[#e0e0e0] text-[10px] rounded px-2 py-1 uppercase outline-none focus:border-accent"
            >
               {(Object.values(ExplainMode) as ExplainMode[]).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-[#666] hover:text-accent transition-colors relative"
          >
            <Settings className="w-4 h-4" />
            {!Object.values(settings.providers).some((p: ProviderState) => p.enabled && p.apiKey) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </header>

      <ProviderSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={setSettings}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Code Editor */}
        <section className="flex-1 md:border-r border-[#222] relative flex flex-col h-1/2 md:h-auto overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-2 bg-[#111] border-b border-[#222] shrink-0">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#666]" />
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Editor</span>
            </div>
            {analysis && (
              <div className="flex gap-2">
                {['explanation', 'timeline'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v as any)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] uppercase tracking-tighter transition-all",
                      view === v ? "bg-accent/20 text-accent border border-accent/30" : "text-[#444] hover:text-[#666]"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative flex-1 bg-[#0d0d0d] overflow-hidden">
             {!analysis ? (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your code here to start intelligence gathering..."
                className="w-full h-full bg-transparent p-4 md:p-8 text-sm leading-relaxed outline-none resize-none font-mono"
                spellCheck={false}
              />
            ) : (
              <div className="absolute inset-0 overflow-auto p-4 md:p-8 no-scrollbar">
                {analysis.steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr] py-1 cursor-pointer transition-all border-l-2",
                      currentIndex === idx 
                        ? "bg-accent/5 border-accent opacity-100" 
                        : "border-transparent opacity-30 hover:opacity-100"
                    )}
                  >
                    <span className="text-right pr-4 md:pr-6 text-[#666] select-none text-[10px] md:text-xs">{step.lineNumber}</span>
                    <span className="text-xs md:text-sm whitespace-pre-wrap">{step.code}</span>
                  </motion.div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0d0d0d]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 md:w-12 md:h-12 border-2 border-accent border-t-transparent rounded-full mb-4 md:mb-6"
                  />
                  <p className="text-accent text-xs md:text-sm tracking-[0.2em] font-bold uppercase animate-pulse">Running Neural Inference</p>
                  <span className="text-[9px] md:text-[10px] text-[#666] mt-2 uppercase">Analyzing Abstract Syntax Tree...</span>
                  {switchingProvider && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="mt-6 md:mt-8 flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[9px] md:text-[10px] font-bold uppercase"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" /> Failover: Switching to {switchingProvider}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right: Insight Panel */}
        <section className="w-full md:w-[400px] lg:w-[450px] bg-[#141414] border-t md:border-t-0 md:border-l border-[#222] flex flex-col h-1/2 md:h-auto overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-[#222] shrink-0">
            <div className="flex gap-2 md:gap-4">
              <button 
                onClick={() => setView('explanation')}
                className={cn("text-[10px] uppercase tracking-widest py-2 transition-colors", view === 'explanation' ? "text-accent border-b-2 border-accent" : "text-[#666] hover:text-[#999]")}
              >Intelligence</button>
              <button 
                onClick={() => setView('insights')}
                className={cn("text-[10px] uppercase tracking-widest py-2 transition-colors", view === 'insights' ? "text-accent border-b-2 border-accent" : "text-[#666] hover:text-[#999]")}
              >Metrics</button>
              <button 
                onClick={() => setView('docs')}
                className={cn("text-[10px] uppercase tracking-widest py-2 transition-colors", view === 'docs' ? "text-accent border-b-2 border-accent" : "text-[#666] hover:text-[#999]")}
              >Report</button>
            </div>
            {analysis && (
              <button onClick={copyDoc} className="p-1 text-[#666] hover:text-accent">
                <Download className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-6 md:p-8 scroll-smooth no-scrollbar">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div 
                  key={view}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {view === 'explanation' && currentIndex >= 0 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-accent font-bold uppercase tracking-widest">
                          <Zap className="w-3 h-3" /> Intent Extraction
                        </div>
                        <p className="text-lg font-light leading-relaxed">{analysis.steps[currentIndex].intent}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-[#666] font-bold uppercase tracking-widest">
                          <Microscope className="w-3 h-3" /> Deep Explanation
                        </div>
                        <p className="text-sm text-[#999] leading-6 font-light">{analysis.steps[currentIndex].explanation}</p>
                      </div>

                      {analysis.steps[currentIndex].optimizationSuggestion && (
                        <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-accent font-bold uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" /> Optimization Suggested
                          </div>
                          <p className="text-[11px] text-accent/80 italic">{analysis.steps[currentIndex].optimizationSuggestion}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-4">
                        {analysis.steps[currentIndex].relatedConcepts.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#222] text-[#666] text-[9px] uppercase rounded border border-[#333]">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-[#222] grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[9px] text-[#444] uppercase mb-1">Risk Level</p>
                            <div className="flex items-center gap-2">
                              <Shield className={cn("w-3 h-3", {
                                'text-green-500': analysis.steps[currentIndex].riskLevel === 'Low',
                                'text-yellow-500': analysis.steps[currentIndex].riskLevel === 'Medium',
                                'text-orange-500': analysis.steps[currentIndex].riskLevel === 'High',
                                'text-red-500': analysis.steps[currentIndex].riskLevel === 'Critical',
                              })} />
                              <span className="text-xs font-bold">{analysis.steps[currentIndex].riskLevel}</span>
                            </div>
                         </div>
                         <div>
                            <p className="text-[9px] text-[#444] uppercase mb-1">Confidence</p>
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 bg-[#222] rounded-full overflow-hidden">
                                <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${analysis.steps[currentIndex].confidenceScore * 100}%` }} />
                              </div>
                              <span className="text-[10px]">{(analysis.steps[currentIndex].confidenceScore * 100).toFixed(0)}%</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}

                  {view === 'insights' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] text-[#666] uppercase tracking-widest">Complexity Index</p>
                           <span className="text-accent font-bold text-2xl">{analysis.complexityScore}</span>
                        </div>
                        <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.complexityScore}%` }}
                            className="h-full bg-linear-to-r from-accent/50 to-accent"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] text-[#666] uppercase tracking-widest">Maintainability Observations</p>
                        <div className="space-y-3">
                          {analysis.maintainabilityObservations.map((obs, i) => (
                            <div key={i} className="flex gap-3 text-xs leading-5">
                              <CheckCircle2 className="w-4 h-4 text-accent/50 shrink-0 mt-0.5" />
                              <span className="text-[#999]">{obs}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] text-[#666] uppercase tracking-widest">Architectural Insights</p>
                        <div className="space-y-3">
                          {analysis.architecturalObservations.map((obs, i) => (
                            <div key={i} className="flex gap-3 text-xs leading-5">
                              <Layers className="w-4 h-4 text-accent/50 shrink-0 mt-0.5" />
                              <span className="text-[#999]">{obs}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {view === 'docs' && (
                    <div className="space-y-6">
                       <div className="p-6 bg-[#1a1a1a] rounded-xl border border-[#222] space-y-4">
                          <div className="flex items-center gap-2 text-accent">
                            <GraduationCap className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Intelligence Report</h3>
                          </div>
                          <p className="text-sm text-[#999] leading-relaxed italic">
                            "{analysis.overview}"
                          </p>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[10px] text-[#666] uppercase tracking-widest">Export Options</p>
                          <button onClick={copyDoc} className="w-full py-3 border border-[#333] rounded hover:bg-[#222] transition-colors flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-[#999]">
                            <Copy className="w-4 h-4" /> Export To Markdown
                          </button>
                       </div>
                    </div>
                  )}

                  {view === 'timeline' && (
                    <div className="space-y-4">
                       <p className="text-[10px] text-[#666] uppercase tracking-widest">Logical Flow Trace</p>
                       <div className="relative pl-6 space-y-6 border-l border-[#222]">
                          {analysis.steps.map((s, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "relative pt-1 cursor-pointer group",
                                currentIndex === i ? "opacity-100" : "opacity-30 hover:opacity-60"
                              )}
                              onClick={() => setCurrentIndex(i)}
                            >
                               <div className={cn(
                                 "absolute -left-[31px] top-1.5 w-2 h-2 rounded-full border-2 border-[#141414] transition-all",
                                 currentIndex === i ? "bg-accent scale-150" : "bg-[#444]"
                               )} />
                               <p className="text-[9px] text-[#666] mb-1">STEP {i + 1}</p>
                               <p className="text-xs transition-colors group-hover:text-[#e0e0e0] truncate">{s.intent}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                  <Search className="w-12 h-12" />
                  <div>
                    <h3 className="uppercase tracking-[0.3em] font-bold text-xs mb-2">Neural Link Inactive</h3>
                    <p className="text-[10px] max-w-[200px] mx-auto">Upload or paste source code to initialize cognitive processing.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer Controls */}
      <footer className="px-4 md:px-6 py-4 border-t border-[#222] bg-[#141414] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
          {!analysis ? (
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              className="bg-accent text-black font-bold h-10 px-6 md:px-8 rounded flex-1 sm:flex-none flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
            >
              <Play className="w-4 h-4 fill-black" /> ANALYZE CODE
            </button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex <= 0}
                className="flex-1 sm:w-10 sm:h-10 border border-[#333] rounded flex items-center justify-center text-[#666] hover:text-accent disabled:opacity-20 transition-colors py-2 sm:py-0"
                title="Previous Step"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentIndex(next => Math.min(analysis.steps.length - 1, next + 1))}
                disabled={currentIndex >= (analysis?.steps.length ?? 0) - 1}
                className="flex-1 sm:w-10 sm:h-10 border border-[#333] rounded flex items-center justify-center text-[#666] hover:text-accent disabled:opacity-20 transition-colors py-2 sm:py-0"
                title="Next Step"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setAnalysis(null);
                  setCurrentIndex(-1);
                  setView('explanation');
                }}
                className="flex-1 sm:h-10 px-4 border border-[#333] rounded flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-[#666] hover:text-[#e0e0e0] transition-colors py-2 sm:py-0"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto justify-end">
            <div className="text-right">
              <p className="text-[8px] md:text-[9px] text-[#444] uppercase tracking-widest mb-0.5">Provider</p>
              <p className="text-[9px] md:text-[10px] text-accent font-bold uppercase tracking-tight">{analysis.providerUsed}</p>
            </div>
            <div className="h-8 w-[1px] bg-[#222]" />
            <div className="text-right">
              <p className="text-[8px] md:text-[9px] text-[#444] uppercase tracking-widest mb-0.5">Progress</p>
              <p className="text-[9px] md:text-[10px] text-[#e0e0e0] font-bold tabular-nums">STEP {currentIndex + 1} // {analysis.steps.length}</p>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
