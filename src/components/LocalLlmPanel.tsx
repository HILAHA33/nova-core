import React, { useState, useEffect } from 'react';
import {
  Brain,
  Download,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Zap,
  Code2,
  Trash2,
  Server,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  SUPPORTED_LOCAL_MODELS,
  LocalModelOption,
  LoadProgress,
  webLlmManager,
} from '../lib/webLlmEngine.js';
import { localServerManager } from '../lib/localOllamaEngine.js';

interface LocalLlmPanelProps {
  onSelectModelForChat: (modelId: string, isLocalWebGPU: boolean) => void;
  activeModelId?: string;
}

export const LocalLlmPanel: React.FC<LocalLlmPanelProps> = ({
  onSelectModelForChat,
  activeModelId,
}) => {
  const [selectedModel, setSelectedModel] = useState<LocalModelOption>(SUPPORTED_LOCAL_MODELS[0]);
  const [loadProgress, setLoadProgress] = useState<LoadProgress>({
    status: webLlmManager.isLoaded() ? 'ready' : 'idle',
    progressPercent: webLlmManager.isLoaded() ? 100 : 0,
    text: webLlmManager.isLoaded() ? 'Model loaded in WebGPU memory' : 'Ready to download & run',
  });
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null);
  const [webGpuReason, setWebGpuReason] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'webgpu' | 'ollama' | 'code'>('webgpu');

  // Ollama state
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>('http://localhost:11434');
  const [ollamaConnected, setOllamaConnected] = useState<boolean>(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isCheckingOllama, setIsCheckingOllama] = useState<boolean>(false);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>('');

  // Check WebGPU on mount
  useEffect(() => {
    webLlmManager.checkWebGpuSupport().then((res) => {
      setWebGpuSupported(res.supported);
      if (!res.supported && res.reason) {
        setWebGpuReason(res.reason);
      }
    });
  }, []);

  const handleDownloadAndLoad = async (model: LocalModelOption) => {
    try {
      setSelectedModel(model);
      await webLlmManager.loadModel(model.id, (prog) => {
        setLoadProgress(prog);
      });
      onSelectModelForChat(model.id, true);
    } catch (err: any) {
      console.error('Failed to load local model:', err);
    }
  };

  const handleUnload = async () => {
    await webLlmManager.unload();
    setLoadProgress({
      status: 'idle',
      progressPercent: 0,
      text: 'Model unloaded from WebGPU memory.',
    });
  };

  const handleCheckOllama = async () => {
    setIsCheckingOllama(true);
    localServerManager.setEndpoint(ollamaEndpoint);
    const res = await localServerManager.checkConnection();
    setOllamaConnected(res.connected);
    setOllamaModels(res.models);
    if (res.models.length > 0) {
      setSelectedOllamaModel(res.models[0]);
    }
    setIsCheckingOllama(false);
  };

  return (
    <div className="bg-[#0B101B] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F1626]/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">Local Open-Source Neural Models</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0 API Keys Required
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Run genuine Meta Llama 3.2, Qwen 2.5, and DeepSeek directly on your device with complete code control
            </p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('webgpu')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'webgpu'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            In-Browser WebGPU
          </button>
          <button
            onClick={() => setActiveSubTab('ollama')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'ollama'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Local Ollama / Server
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'code'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            AI Code & Settings
          </button>
        </div>
      </div>

      {/* WebGPU Tab */}
      {activeSubTab === 'webgpu' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* WebGPU Status notification */}
          {webGpuSupported === false && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">WebGPU Hardware Acceleration Notice: </span>
                {webGpuReason || 'WebGPU is disabled in your browser. Enable hardware acceleration or use the Local Ollama tab.'}
              </div>
            </div>
          )}

          {/* Active Loading or Ready state banner */}
          {(loadProgress.status === 'downloading' || loadProgress.status === 'compiling') && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{loadProgress.status === 'downloading' ? 'Downloading Model Weights into IndexedDB Cache...' : 'Compiling WebGPU Shaders...'}</span>
                </div>
                <span className="font-bold text-slate-200">{loadProgress.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadProgress.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 truncate">{loadProgress.text}</p>
            </div>
          )}

          {loadProgress.status === 'ready' && webLlmManager.isLoaded() && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-emerald-300">
                    Active in WebGPU: {webLlmManager.getLoadedModelId()}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ready for real-time streaming inference with 0 API keys and 0 latency.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectModelForChat(webLlmManager.getLoadedModelId()!, true)}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Use in Playground
                </button>
                <button
                  onClick={handleUnload}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Unload from VRAM"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {loadProgress.status === 'error' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <span className="font-semibold">Initialization Error: </span>
              {loadProgress.error || 'Failed to download or allocate WebGPU memory.'}
            </div>
          )}

          {/* Educational Callout: What Download Does vs Using This Site as an API Provider */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>How Local Models Work vs. Serving Your Other Website as an API Provider</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 pt-1">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-emerald-400 block mb-1">
                  1. When You Click "Download & Run" (In-Browser WebGPU)
                </span>
                <p className="text-slate-400 leading-relaxed">
                  The model weights (~870 MB to 2.2 GB) stream from Hugging Face into your computer's local browser storage (IndexedDB). Your local GPU then compiles shaders to run inferences inside this browser tab with zero API keys and zero server cost.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-indigo-400 block mb-1">
                  2. Using This Website as an API Provider for Your Other Site
                </span>
                <p className="text-slate-400 leading-relaxed">
                  External websites cannot tap into your laptop's WebGPU tab directly. Instead, your other website makes a standard HTTP request to this backend server at <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/v1/chat/completions</code> with <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">model: "meta-llama/Llama-3.3-70B-Instruct"</code>!
                </p>
              </div>
            </div>
          </div>

          {/* Model cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SUPPORTED_LOCAL_MODELS.map((model) => {
              const isCurrent = webLlmManager.getLoadedModelId() === model.id;
              const isLoading = loadProgress.status === 'downloading' && selectedModel.id === model.id;

              return (
                <div
                  key={model.id}
                  className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                      : 'bg-[#0E1524] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                          {model.family}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-100">{model.name}</h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        {model.downloadSize}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      {model.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 mb-4">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1">
                        Best For
                      </div>
                      <div className="text-xs text-slate-300">{model.recommendedFor}</div>
                    </div>
                  </div>

                  <button
                    disabled={loadProgress.status === 'downloading' || loadProgress.status === 'compiling'}
                    onClick={() => handleDownloadAndLoad(model)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        Loaded & Active
                      </>
                    ) : isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        Download & Run ({model.downloadSize})
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Weights are downloaded once into your browser’s IndexedDB cache. Subsequent launches load in seconds from disk without re-downloading.
            </span>
          </div>
        </div>
      )}

      {/* Ollama Tab */}
      {activeSubTab === 'ollama' && (
        <div className="p-4 sm:p-6 space-y-5">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Connect to Local Ollama / llama.cpp Server</h3>
              <p className="text-xs text-slate-400 mt-1">
                If you have Ollama running locally (<code className="text-emerald-400">ollama run llama3.2</code> or <code className="text-emerald-400">ollama run mistral</code>), you can route requests straight to your machine.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 min-w-[240px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleCheckOllama}
                disabled={isCheckingOllama}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                {isCheckingOllama ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Check Connection
              </button>
            </div>

            {ollamaConnected ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Connected! Found {ollamaModels.length} models on local server:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ollamaModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedOllamaModel(m);
                        onSelectModelForChat(`ollama:${m}`, false);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        selectedOllamaModel === m
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
                Ollama status: Not connected yet. To run Ollama locally on your computer, open a terminal and run:
                <div className="mt-1.5 p-2 bg-slate-900 rounded font-mono text-emerald-300 text-[11px]">
                  OLLAMA_ORIGINS="*" ollama serve
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code & Customization Tab */}
      {activeSubTab === 'code' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="text-xs text-slate-300 leading-relaxed">
            Because this engine is open-source and part of the codebase, you can edit the prompt engineering, decoding parameters, and model options directly in{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">/src/lib/webLlmEngine.ts</code>.
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-2">
            <div className="text-slate-500">// Example: Editing the generation parameters in webLlmEngine.ts</div>
            <div className="text-indigo-400">const chunks = await this.engine.chat.completions.create({`{`}</div>
            <div className="pl-4 text-slate-200">messages: messagesToSend,</div>
            <div className="pl-4 text-emerald-400">temperature: 0.7, <span className="text-slate-500">// Change creativity (0.1 to 1.0)</span></div>
            <div className="pl-4 text-emerald-400">top_p: 0.9,       <span className="text-slate-500">// Change nucleus sampling</span></div>
            <div className="pl-4 text-emerald-400">max_tokens: 2048,  <span className="text-slate-500">// Set maximum output tokens</span></div>
            <div className="pl-4 text-slate-200">stream: true,</div>
            <div className="text-indigo-400">{`}`});</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-slate-200">Where are model weights stored?</span>
              <p className="mt-1">
                Weights are stored safely in your browser’s IndexedDB sandbox under the MLC WebLLM origin cache.
              </p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-slate-200">Zero Server Cost</span>
              <p className="mt-1">
                Your device executes 100% of the token math. No third-party API bills, no rate limits, and 0 data leakage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
