import React, { useState, useEffect } from 'react';
import OpportunityGrid from './components/OpportunityGrid';
import EditModal from './components/EditModal';
import AdminModal from './components/AdminModal';
import * as api from './api';
import { Opportunity, Account, Employee, OpportunityStatus, OpportunityType, Motive } from './types/types';
import { Plus, Layers, Search, Settings, Trash2, Download, ArrowRightLeft, Filter, X } from 'lucide-react';

function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTab, setActiveTab] = useState<'ON' | 'ON-OUT' | 'TRASH'>('ON');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterAccount, setFilterAccount] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterManager, setFilterManager] = useState<string>('');
  const [filterAprobador, setFilterAprobador] = useState<string>('');
  const [filterNegocio, setFilterNegocio] = useState<string>('');
  const [filterTecnico, setFilterTecnico] = useState<string>('');
  const [filterKRed, setFilterKRed] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | undefined>(undefined);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Lists
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<OpportunityStatus[]>([]);
  const [oppTypes, setOppTypes] = useState<OpportunityType[]>([]);
  const [motives, setMotives] = useState<Motive[]>([]);

  const fetchData = async () => {
    try {
        const [opps, acc, emp, sta, oty, mot] = await Promise.all([
            api.getOpportunities(activeTab),
            api.getAccounts(),
            api.getEmployees(),
            api.getStatuses(),
            api.getOppTypes(),
            api.fetchApi('/motives')
        ]);
        setOpportunities(opps);
        setAccounts(acc);
        setEmployees(emp);
        setStatuses(sta);
        setOppTypes(oty);
        setMotives(mot);
    } catch (err) {
        console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSave = async (data: Partial<Opportunity>) => {
    try {
        if (!isNewRecord && editingOpp?.id) {
            await api.updateOpportunity(editingOpp.id, data);
        } else {
            await api.createOpportunity(data);
        }
        setIsModalOpen(false);
        setEditingOpp(undefined);
        setIsNewRecord(false);
        fetchData();
    } catch (err) {
        alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
      if (activeTab === 'TRASH') {
          if (!window.confirm('¿Eliminar definitivamente?')) return;
          await api.permanentDeleteOpportunity(id);
      } else {
          if (!window.confirm('¿Mover a papelera?')) return;
          await api.deleteOpportunity(id);
      }
      fetchData();
  };

  const handleArchive = async (opp: Opportunity) => {
      await api.updateOpportunity(opp.id, { is_archived: true });
      fetchData();
  };

  const handleUnarchive = async (opp: Opportunity) => {
      await api.updateOpportunity(opp.id, { is_archived: false });
      fetchData();
  };

  const handleRestoreFromTrash = async (opp: Opportunity) => {
      try {
          await api.restoreOpportunity(opp.id);
          fetchData();
      } catch (err) {
          alert(`Error al restaurar: ${err.message}`);
      }
  };

  // REQ 3: Mover filas
  const handleMoveToHistory = async () => {
      if (!window.confirm("¿Desea mover registros a históricos según las reglas de negocio?")) return;
      
      const toMove = opportunities.filter(o => {
          // Rule 3.1: Color Rojo y k-orden (k_red_index) >= 3
          
          const isRed = o.color_code === 'RED';
          // Asumimos que "k-orden" se refiere al índice K-Rojo visible en la UI.
          const highKRedIndex = (o.k_red_index || 0) >= 3; 

          if (isRed && highKRedIndex) return true;

          // Rule 3.2: Estado contiene "Ganada" o "Perdida"
          const status = (o.status_name || "").toUpperCase();
          if (status.includes("GANADA") || status.includes("PERDIDA")) return true;

          return false;
      });

      if (toMove.length === 0) {
          alert("No hay registros que cumplan las condiciones para ser movidos.");
          return;
      }

      try {
          await Promise.all(toMove.map(o => api.updateOpportunity(o.id, { is_archived: true })));
          alert(`${toMove.length} registros movidos a históricos.`);
          fetchData();
      } catch (err) {
          alert("Error al mover registros.");
      }
  };

  // REQ 1: Nueva Fila con ID autocompletado
  const handleNewOpportunity = async () => {
    try {
        const { max_id } = await api.getMaxOpportunityId();
        const nextId = max_id + 1;
        const today = new Date().toISOString().split('T')[0];

        setEditingOpp({
            id: nextId,
            name: '',
            account_id: accounts[0]?.id || 0,
            status_id: statuses.find(s => s.name.toUpperCase().includes('EVALUACIÓN'))?.id || statuses[0]?.id || 0,
            manager_id: employees.find(e => e.role_name === 'Gerente Comercial')?.id || employees[0]?.id || 0,
            percentage: 0,
            color_code: 'NONE',
            start_date: today,
            is_archived: false,
            has_ia_proposal: false,
            has_prototype: false
        } as Opportunity);
        setIsNewRecord(true);
        setIsModalOpen(true);
    } catch (err) {
        console.error(err);
    }
  };

  // REQ 2: Ordenar filas (Solo en ON)
  const sortOpportunities = (opps: Opportunity[]) => {
      if (activeTab !== 'ON') return opps;

      const statusOrder = ["EVALUACIÓN", "ELABORACIÓN", "ESPERANDO RESPUESTA", "REASIGNADO A CAPACITY", "DESESTIMADA", "GANADA", "PERDIDA"];

      return [...opps].sort((a, b) => {
          // 2.1: Registros sin datos cargados
          const aEmpty = !a.name && !a.account_id;
          const bEmpty = !b.name && !b.account_id;
          if (aEmpty && !bEmpty) return -1;
          if (!aEmpty && bEmpty) return 1;

          // 2.2: Name cargado, Gerente cargado, pero Estado vacío
          const aMissingStatus = a.name && a.manager_id && !a.status_id;
          const bMissingStatus = b.name && b.manager_id && !b.status_id;
          if (aMissingStatus && !bMissingStatus) return -1;
          if (!aMissingStatus && bMissingStatus) return 1;

          // 2.3: Por orden de estado
          const aStatusIdx = statusOrder.findIndex(s => (a.status_name || "").toUpperCase().includes(s));
          const bStatusIdx = statusOrder.findIndex(s => (b.status_name || "").toUpperCase().includes(s));
          
          if (aStatusIdx !== -1 && bStatusIdx !== -1) {
              if (aStatusIdx !== bStatusIdx) return aStatusIdx - bStatusIdx;
          } else if (aStatusIdx !== -1) return -1;
          else if (bStatusIdx !== -1) return 1;

          // 2.4: K-rojo descendente
          const kDiff = (b.k_red_index || 0) - (a.k_red_index || 0);
          if (kDiff !== 0) return kDiff;

          // 2.5: ID descendente
          return b.id - a.id;
      });
  };

  const filteredOpps = sortOpportunities(opportunities.filter(o => {
      const matchSearch = searchTerm === '' || 
          o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.account_name && o.account_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (o.manager_name && o.manager_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (o.dc_name && o.dc_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (o.neg_name && o.neg_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (o.tec_name && o.tec_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchAccount = filterAccount === '' || o.account_name === filterAccount;
      const matchStatus = filterStatus === '' || o.status_name === filterStatus;
      const matchManager = filterManager === '' || o.manager_name === filterManager;
      const matchAprobador = filterAprobador === '' || o.dc_name === filterAprobador;
      const matchNegocio = filterNegocio === '' || o.neg_name === filterNegocio;
      const matchTecnico = filterTecnico === '' || o.tec_name === filterTecnico;
      const matchKRed = filterKRed === '' || String(o.k_red_index) === filterKRed;

      return matchSearch && matchAccount && matchStatus && matchManager && matchAprobador && matchNegocio && matchTecnico && matchKRed;
  }));

  const clearFilters = () => {
    setFilterAccount('');
    setFilterStatus('');
    setFilterManager('');
    setFilterAprobador('');
    setFilterNegocio('');
    setFilterTecnico('');
    setFilterKRed('');
  };

  const filterSelectClass = "bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:border-blue-400 min-w-[100px]";

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-xs text-gray-800">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="mx-auto px-4 py-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-md">
                    <Layers size={18} />
                </div>
                <h1 className="text-lg font-black text-gray-800 tracking-tight uppercase">Gestor de oportunidades</h1>
            </div>
            
            <div className="flex items-center space-x-2">
                 <button onClick={() => setIsAdminOpen(true)} className="flex items-center gap-1.5 p-1.5 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100 rounded-lg" title="Configuración">
                    <Settings size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Configuración</span>
                 </button>
                 
                 <button onClick={handleMoveToHistory} className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-black text-orange-600 hover:bg-orange-50 border-orange-200 uppercase tracking-widest shadow-sm transition-all">
                    <ArrowRightLeft size={12} />
                    <span>Mover a historicos</span>
                 </button>
                 
                 <button onClick={handleNewOpportunity} className="flex items-center space-x-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">
                    <Plus size={16} />
                    <span>Nueva Oportunidad</span>
                 </button>
            </div>
        </div>
      </header>

      <main className="px-4 py-2">
        <div className="flex items-center justify-between mb-1">
            <div className="flex space-x-1">
                <button onClick={() => setActiveTab('ON')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg ${activeTab === 'ON' ? 'bg-white border-t border-x border-gray-200 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>ON (Activas)</button>
                <button onClick={() => setActiveTab('ON-OUT')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg ${activeTab === 'ON-OUT' ? 'bg-white border-t border-x border-gray-200 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>ON-OUT (Históricos)</button>
                <button onClick={() => setActiveTab('TRASH')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg flex items-center gap-2 ${activeTab === 'TRASH' ? 'bg-white border-t border-x border-gray-200 text-red-600' : 'text-gray-400 hover:text-red-400'}`}>
                    <Trash2 size={12}/> PAPELERA
                </button>
            </div>
        </div>

        <div className="mb-2 flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
                <input 
                    type="text" placeholder="Buscar..." 
                    className="pl-10 pr-4 py-1.5 border-none rounded-lg text-xs w-full outline-none focus:ring-0 placeholder:text-gray-300 font-medium bg-gray-50/50"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
                <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-tighter mr-1">
                    <Filter size={12}/> Filtros:
                </div>
                
                <select className={filterSelectClass} value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
                    <option value="">Cuenta (Todas)</option>
                    {Array.from(new Set(opportunities.map(o => o.account_name).filter(Boolean))).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <select className={filterSelectClass} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Estado (Todos)</option>
                    {Array.from(new Set(opportunities.map(o => o.status_name).filter(Boolean))).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <select className={filterSelectClass} value={filterManager} onChange={e => setFilterManager(e.target.value)}>
                    <option value="">Gte (Todos)</option>
                    {Array.from(new Set(opportunities.map(o => o.manager_name).filter(Boolean))).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <select className={filterSelectClass} value={filterAprobador} onChange={e => setFilterAprobador(e.target.value)}>
                    <option value="">Aprob (Todos)</option>
                    {Array.from(new Set(opportunities.map(o => o.dc_name).filter(Boolean))).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <select className={filterSelectClass} value={filterNegocio} onChange={e => setFilterNegocio(e.target.value)}>
                    <option value="">Neg (Todos)</option>
                    {Array.from(new Set(opportunities.map(o => o.neg_name).filter(Boolean))).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <select className={filterSelectClass} value={filterTecnico} onChange={e => setFilterTecnico(e.target.value)}>
                    <option value="">Tec (Todos)</option>
                    {Array.from(new Set(opportunities.map(o => o.tec_name).filter(Boolean))).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <select className={filterSelectClass} value={filterKRed} onChange={e => setFilterKRed(e.target.value)}>
                    <option value="">K-Rojo (Todos)</option>
                    {Array.from(new Set(opportunities.map(o => String(o.k_red_index)))) .sort((a,b) => Number(a)-Number(b)).map(val => (
                        <option key={val} value={val}>{val}</option>
                    ))}
                </select>

                {(filterAccount || filterStatus || filterManager || filterAprobador || filterNegocio || filterTecnico || filterKRed) && (
                    <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[9px] font-black uppercase hover:bg-red-100 transition-all shadow-sm whitespace-nowrap">
                        <X size={12}/> <span>Limpiar</span>
                    </button>
                )}
            </div>
            
            {activeTab !== 'TRASH' && (
                <div className="flex items-center space-x-1 ml-auto">
                    <div className="flex gap-1">
                        <button className="p-1.5 bg-green-50 text-green-700 border border-green-100 rounded hover:bg-green-100" title="Exportar Pablo"><Download size={12}/></button>
                        <button className="p-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded hover:bg-blue-100" title="Exportar JP"><Download size={12}/></button>
                        <button className="p-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded hover:bg-orange-100" title="Exportar DC"><Download size={12}/></button>
                    </div>
                </div>
            )}
        </div>

        <OpportunityGrid 
            data={filteredOpps}
            onOpenDetail={(opp) => { setEditingOpp(opp); setIsNewRecord(false); setIsModalOpen(true); }}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onRestore={handleRestoreFromTrash}
            onDelete={handleDelete}
            onUpdate={fetchData}
            isHistoryView={activeTab === 'ON-OUT'}
            isTrashView={activeTab === 'TRASH'}
            accounts={accounts}
            employees={employees}
            statuses={statuses}
            oppTypes={oppTypes}
            motives={motives}
        />
      </main>

      {isModalOpen && <EditModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingOpp(undefined); setIsNewRecord(false); }} 
        onSave={handleSave}
        initialData={editingOpp}
        isNew={isNewRecord}
        isReadOnly={activeTab !== 'ON'}
        accounts={accounts}
        teams={employees}
        statuses={statuses}
        oppTypes={oppTypes}
      />}

      {isAdminOpen && <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
}

export default App;
