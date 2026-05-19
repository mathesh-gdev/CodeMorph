import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ExternalLink, Shield, ShieldAlert, CheckCircle2, 
  AlertCircle, Clock, Trash2, Key, ToggleLeft, ToggleRight, 
  Settings2, Activity, Zap, RefreshCw, BarChart3, Plus, Eye, EyeOff
} from 'lucide-react';
import { PROVIDERS, AppSettings, ProviderState, DEFAULT_SETTINGS } from '../constants/providers';
import { cn } from '../lib/utils';
import { testProvider } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

export default function ProviderSettings({ isOpen, onClose, settings, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'providers' | 'advanced'>('providers');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const updateProvider = (id: string, updates: Partial<ProviderState>) => {
    onUpdate({
      ...settings,
      providers: {
        ...settings.providers,
        [id]: { ...settings.providers[id], ...updates }
      }
    });
  };

  const handleTest = async (id: string) => {
    const p = settings.providers[id];
    if (!p.apiKey) return;
    
    setTestingId(id);
    const result = await testProvider(id, p.apiKey);
    updateProvider(id, { 
      status: result.status as any, 
      latency: result.latency,
      lastChecked: new Date().toISOString()
    });
    setTestingId(id);
    setTimeout(() => setTestingId(null), 1000);
  };

  const toggleAll = (enabled: boolean) => {
    const newProviders = { ...settings.providers };
    Object.keys(newProviders).forEach(id => {
      newProviders[id].enabled = enabled;
    });
    onUpdate({ ...settings, providers: newProviders });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0d0d0d]/80 backdrop-blur-md z-[100]"
          />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-[#141414] border-l border-[#222] z-[101] shadow-2xl flex flex-col"
            >
            {/* Header */}
            <div className="p-6 border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-accent" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#e0e0e0]">Infrastructure</h2>
                  <p className="text-[10px] text-[#666] uppercase tracking-widest">AI Provider Configuration</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#222] rounded-full transition-colors text-[#666] hover:text-[#e0e0e0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-[#222] flex gap-6">
              <button 
                onClick={() => setActiveTab('providers')}
                className={cn(
                  "py-4 text-[10px] uppercase font-bold tracking-widest border-b-2 transition-all",
                  activeTab === 'providers' ? "border-accent text-accent" : "border-transparent text-[#666]"
                )}
              >
                Providers
              </button>
              <button 
                onClick={() => setActiveTab('advanced')}
                className={cn(
                  "py-4 text-[10px] uppercase font-bold tracking-widest border-b-2 transition-all",
                  activeTab === 'advanced' ? "border-accent text-accent" : "border-transparent text-[#666]"
                )}
              >
                Global Settings
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'providers' ? (
                <div className="space-y-4">
                  {PROVIDERS.map(p => {
                    const state = settings.providers[p.id];
                    const isTesting = testingId === p.id;
                    const Icon = p.logo;

                    return (
                      <div key={p.id} className="p-5 bg-[#0d0d0d] border border-[#222] rounded-xl space-y-4 group transition-all hover:border-[#333]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#1a1a1a] border border-[#222] rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[#e0e0e0]">{p.name}</h3>
                              <p className="text-[10px] text-[#666] mt-0.5">{p.description}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => updateProvider(p.id, { enabled: !state.enabled })}
                            className={cn(
                              "transition-colors",
                              state.enabled ? "text-accent" : "text-[#444]"
                            )}
                          >
                            {state.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                          </button>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <Key className="w-3 h-3 text-[#444]" />
                               <span className="text-[9px] uppercase font-bold text-[#444] tracking-widest">API Key</span>
                             </div>
                             {state.apiKey ? (
                               <a href={p.getKeyUrl} target="_blank" rel="noreferrer" className="text-[9px] text-[#666] hover:text-accent transition-colors flex items-center gap-1">
                                 <ExternalLink className="w-3 h-3" /> Provider Console
                               </a>
                             ) : (
                               <a href={p.getKeyUrl} target="_blank" rel="noreferrer" className="text-[9px] bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full text-accent hover:bg-accent/20 transition-all flex items-center gap-1">
                                 <Plus className="w-2.5 h-2.5" /> Get Free Key
                               </a>
                             )}
                           </div>
                           <div className="flex gap-2">
                             <div className="relative flex-1">
                               <input 
                                 type={showKey[p.id] ? "text" : "password"}
                                 placeholder="••••••••••••••••"
                                 value={state.apiKey}
                                 onChange={(e) => updateProvider(p.id, { apiKey: e.target.value })}
                                 className="w-full bg-[#141414] border border-[#222] rounded-lg px-3 py-2 text-xs text-[#e0e0e0] outline-none focus:border-accent/40"
                               />
                               <button 
                                 onClick={() => setShowKey({ ...showKey, [p.id]: !showKey[p.id] })}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#444] hover:text-[#e0e0e0] transition-colors"
                               >
                                 {showKey[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                               </button>
                             </div>
                             <button 
                               onClick={() => handleTest(p.id)}
                               disabled={!state.apiKey || isTesting}
                               className={cn(
                                 "px-3 py-2 border rounded-lg transition-all flex items-center gap-2 text-xs font-bold whitespace-nowrap",
                                 isTesting ? "animate-pulse border-accent/20 text-[#666]" : "border-[#222] text-[#666] hover:border-accent/40 hover:text-accent"
                               )}
                             >
                               <Activity className={cn("w-3.5 h-3.5", isTesting && "animate-spin")} />
                               {isTesting ? "Testing..." : "Test"}
                             </button>
                           </div>
                        </div>

                        {state.status !== 'untested' && (
                          <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                            <div className="flex items-center gap-2">
                              {state.status === 'healthy' ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <ShieldAlert className="w-3 h-3 text-red-500" />
                              )}
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                state.status === 'healthy' ? "text-green-500/80" : "text-red-500/80"
                              )}>
                                {state.status.replace('_', ' ')}
                              </span>
                            </div>
                            {state.latency && (
                              <div className="flex items-center gap-1.5 text-[10px] text-[#666]">
                                <Clock className="w-3 h-3" />
                                <span>{state.latency}ms</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="space-y-4">
                      <h4 className="text-[10px] uppercase font-bold text-[#666] tracking-widest pl-1">Failover Logic</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="w-4 h-4 text-accent" />
                            <div>
                               <p className="text-sm font-bold">Auto-Fallback</p>
                               <p className="text-[10px] text-[#666]">Switch providers automatically on failure</p>
                            </div>
                          </div>
                          <button onClick={() => onUpdate({ ...settings, autoFallback: !settings.autoFallback })}>
                            {settings.autoFallback ? <ToggleRight className="w-6 h-6 text-accent" /> : <ToggleLeft className="w-6 h-6 text-[#444]" />}
                          </button>
                        </div>

                        <div className="space-y-2 p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                            <p className="text-[10px] text-[#666] uppercase font-bold mb-3 tracking-widest">Preferred Gateway</p>
                            <select 
                              value={settings.preferredProvider}
                              onChange={(e) => onUpdate({ ...settings, preferredProvider: e.target.value })}
                              className="w-full bg-[#141414] border border-[#222] rounded-lg px-3 py-2 text-xs text-[#e0e0e0] outline-none"
                            >
                              {PROVIDERS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] uppercase font-bold text-[#666] tracking-widest pl-1">Inference Options</h4>
                      <div className="space-y-2">
                         <div className="grid grid-cols-3 gap-2">
                            {(['latency', 'balanced', 'quality'] as const).map(m => (
                              <button 
                                key={m}
                                onClick={() => onUpdate({ ...settings, mode: m })}
                                className={cn(
                                  "py-3 border rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all",
                                  settings.mode === m ? "bg-accent/10 border-accent text-accent" : "bg-[#0d0d0d] border-[#222] text-[#666]"
                                )}
                              >
                                {m}
                              </button>
                            ))}
                         </div>
                         <div className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                            <div className="flex items-center gap-3">
                              <Zap className="w-4 h-4 text-accent" />
                              <div>
                                 <p className="text-sm font-bold">Streaming Response</p>
                                 <p className="text-[10px] text-[#666]">Show analysis tokens in real-time</p>
                              </div>
                            </div>
                            <button onClick={() => onUpdate({ ...settings, streaming: !settings.streaming })}>
                              {settings.streaming ? <ToggleRight className="w-6 h-6 text-accent" /> : <ToggleLeft className="w-6 h-6 text-[#444]" />}
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-[#222]">
                      <button 
                        onClick={() => onUpdate(DEFAULT_SETTINGS)}
                        className="w-full py-3 border border-red-500/20 text-red-500/60 text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-red-500/5 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> Reset to defaults
                      </button>
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#222] bg-[#141414] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#444]" />
                <span className="text-[10px] text-[#444] uppercase tracking-widest">Session Statistics</span>
              </div>
              <button 
                onClick={onClose}
                className="bg-accent text-black font-bold h-10 px-8 rounded text-xs select-none hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                PROCEED
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
