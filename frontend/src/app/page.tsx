'use client';

import { useState } from 'react';
import { Search, Database, Code2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPlan, setShowPlan] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch data');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200 selection:bg-amber-500/30 font-sans selection:text-amber-200 overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col items-center mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <Database className="w-4 h-4 text-amber-500" />
            <span className="text-xs tracking-widest uppercase text-white/70 font-semibold">VeraBase Engine</span>
          </div>
          <h1 className="text-5xl font-light tracking-tight text-white mb-4">
            Enterprise <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Semantic Layer</span>
          </h1>
          <p className="text-gray-400 max-w-xl text-lg font-light">
            Query your data warehouse with natural language. Deterministic, hallucination-free SQL generation.
          </p>
        </header>

        {/* The Search Bar (Command Center) */}
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-16 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
          <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50">
            <Search className="w-6 h-6 text-gray-500 ml-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What is our total net revenue?"
              className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-lg text-white placeholder-gray-600 font-light"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query}
              className="bg-white/10 hover:bg-amber-500 hover:text-black text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute'}
            </button>
          </div>
        </form>

        {/* Error Handling */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 mb-8 bg-red-950/30 border border-red-500/30 rounded-xl text-red-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        {/* Results Visual Layer */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            
            {/* The Results Card */}
            <div className="bg-[#121212]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
              <h3 className="text-xl font-medium text-white mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-amber-500 rounded-full" />
                Query Results
              </h3>
              
              {/* CONDITIONAL RENDERING: KPI Card vs Bar Chart */}
              {result.data.length === 1 && Object.keys(result.data[0]).length === 1 ? (
                
                // --- THE KPI SCORECARD ---
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="text-gray-500 uppercase tracking-widest text-sm font-semibold mb-4">
                    {Object.keys(result.data[0])[0].replace(/_/g, ' ')}
                  </span>
                  <div className="text-6xl font-light text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                    ${(result.data[0][Object.keys(result.data[0])[0]]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

              ) : (

                // --- THE BAR CHART ---
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.data}>
                      <XAxis 
                        dataKey={Object.keys(result.data[0])[0]} 
                        stroke="#52525b" 
                        tick={{fill: '#a1a1aa', fontSize: 12}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#52525b" 
                        tick={{fill: '#a1a1aa', fontSize: 12}}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        cursor={{fill: '#ffffff', opacity: 0.05}}
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fbbf24' }}
                        formatter={(value: any) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}                      />
                      <Bar 
                        dataKey={Object.keys(result.data[0])[1]} 
                        radius={[6, 6, 0, 0]}
                      >
                        {
                          result.data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#fbbf24' : '#d97706'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Under the Hood - Execution Plan Toggle */}
            <div className="bg-[#121212]/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl transition-all">
              <button 
                onClick={() => setShowPlan(!showPlan)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 font-medium tracking-wide">View Execution Plan & SQL</span>
                </div>
                {showPlan ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>

              {showPlan && (
                <div className="p-6 border-t border-white/5 bg-black/40">
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">Validated Joins (BFS Traversal)</p>
                    <div className="flex flex-wrap gap-2">
                      {result.execution_plan.validated_joins.length > 0 ? (
                        result.execution_plan.validated_joins.map((join: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 text-sm border border-amber-500/20 font-mono">
                            {join}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm italic">Direct table query (No joins required)</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">Generated PostgreSQL</p>
                    <pre className="p-4 rounded-xl bg-[#09090b] border border-white/10 text-emerald-400 font-mono text-sm overflow-x-auto shadow-inner leading-relaxed">
                      <code>{result.sql_query}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}