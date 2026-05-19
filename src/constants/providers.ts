import { 
  Cloud, Zap, Shield, Cpu, Globe, Infinity, 
  ExternalLink, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

export interface ProviderConfig {
  id: string;
  name: string;
  logo: any;
  getKeyUrl: string;
  endpoint?: string;
  description: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: Cpu,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'High performance multimodal model from Google.'
  },
  {
    id: 'groq',
    name: 'Groq',
    logo: Zap,
    getKeyUrl: 'https://console.groq.com/keys',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    description: 'Ultra-low latency inference using LPU tech.'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: Globe,
    getKeyUrl: 'https://openrouter.ai/keys',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    description: 'Unified gateway to 100+ open-source models.'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    logo: Infinity,
    getKeyUrl: 'https://huggingface.co/settings/tokens',
    endpoint: 'https://api-inference.huggingface.co/models/',
    description: 'The home of ML. Access hosted inference endpoints.'
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    logo: Cloud,
    getKeyUrl: 'https://cloud.cerebras.ai/platform',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    description: 'Extreme speed inference for large models.'
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    logo: Shield,
    getKeyUrl: 'https://cloud.sambanova.ai',
    endpoint: 'https://api.sambanova.ai/v1/chat/completions',
    description: 'Enterprise-grade full-stack AI platform.'
  }
];

export interface ProviderState {
  enabled: boolean;
  apiKey: string;
  status: 'healthy' | 'offline' | 'quota_limited' | 'invalid_key' | 'slow' | 'untested';
  latency?: number;
  lastChecked?: string;
}

export interface AppSettings {
  providers: Record<string, ProviderState>;
  autoFallback: boolean;
  preferredProvider: string;
  streaming: boolean;
  mode: 'balanced' | 'latency' | 'quality';
}

export const DEFAULT_SETTINGS: AppSettings = {
  providers: PROVIDERS.reduce((acc, p) => ({
    ...acc,
    [p.id]: {
      enabled: p.id === 'gemini',
      apiKey: '',
      status: 'untested'
    }
  }), {}),
  autoFallback: true,
  preferredProvider: 'gemini',
  streaming: true,
  mode: 'balanced'
};
