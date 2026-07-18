'use client';

import { useState, useEffect } from 'react';
import { Database, Table as TableIcon, Key, Hash, Type, Loader2, ShieldAlert } from 'lucide-react';

interface ColumnDef {
  name: string;
  type: string;
}

interface TableDef {
  table_name: string;
  columns: ColumnDef[];
}

export default function WarehouseExplorerPage() {
  const [tables, setTables] = useState<TableDef[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/api/metadata/warehouse/tables', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch warehouse schema');
        
        const data = await res.json();
        setTables(data);
        if (data.length > 0) setSelectedTable(data[0]); // Auto-select first table
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  // Helper to render the right icon based on SQL data type
  const getColumnIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('float') || t.includes('numeric') || t.includes('double')) return <Hash className="w-4 h-4 text-amber-500" />;
    if (t.includes('char') || t.includes('text')) return <Type className="w-4 h-4 text-blue-400" />;
    return <Key className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2">Warehouse Explorer</h1>
        <p className="text-gray-500 font-light text-sm">Read-only Data Dictionary. Reference your raw database schemas here to write accurate semantic logic.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-200 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-amber-500 animate-spin" /></div>
      ) : (
        <div className="flex gap-6 h-[600px]">
          
          {/* LEFT PANE: Table List */}
          <div className="w-1/3 bg-[#121212]/80 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2 text-sm font-medium text-gray-300 uppercase tracking-widest">
              <Database className="w-4 h-4 text-amber-500" />
              Entity Tables
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {tables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 text-left ${
                    selectedTable?.table_name === table.table_name 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <TableIcon className="w-5 h-5 shrink-0" />
                  <span className="font-medium truncate">{table.table_name}</span>
                </button>
              ))}
              {tables.length === 0 && <div className="p-4 text-sm text-gray-500 text-center">No business tables found.</div>}
            </div>
          </div>

          {/* RIGHT PANE: Column Inspector */}
          <div className="flex-1 bg-[#121212]/80 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
            {selectedTable ? (
              <>
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <TableIcon className="w-6 h-6 text-amber-500" /> {selectedTable.table_name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Schema definition and active columns.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-12 gap-4 pb-4 mb-4 border-b border-white/10 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    <div className="col-span-7">Column Name</div>
                    <div className="col-span-5">Data Type</div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {selectedTable.columns.map((col, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                        <div className="col-span-7 flex items-center gap-3 text-gray-200 font-mono text-sm">
                          {getColumnIcon(col.type)}
                          {col.name}
                        </div>
                        <div className="col-span-5 text-gray-500 font-mono text-xs">
                          {col.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <TableIcon className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a table to inspect its schema.</p>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}