import React, { useState, useEffect } from 'react';
import OpportunityGrid from './components/OpportunityGrid';
import EditModal from './components/EditModal';
import AdminModal from './components/AdminModal';
import { 
    MOCK_DATA, 
    INIT_ACCOUNTS, 
    INIT_EMPLOYEES, 
    INIT_STATUSES, 
    INIT_DOC_TYPES, 
    INIT_OPP_TYPES,
    INIT_JOB_ROLES
} from './constants';
import { Opportunity } from './types';
import { sortOpportunities, shouldArchive } from './utils/businessLogic';
import { Plus, RefreshCw, FileDown, Layers, Search, Settings, AlertTriangle, Trash2 } from 'lucide-react';

function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [history, setHistory] = useState<Opportunity[]>([]); // "ON-OUT"
  const [deletedOpportunities, setDeletedOpportunities] = useState<Opportunity[]>([]); // "TRASH"
  
  const [activeTab, setActiveTab] = useState<'ON' | 'ON-OUT' | 'TRASH'>('ON');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | undefined>(undefined);

  // Custom Confirmation Modal State (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      isDestructive?: boolean;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      isDestructive: false
  });

  // Lists (Catalog Management - Detailed Objects)
  const [accounts, setAccounts] = useState(INIT_ACCOUNTS);
  const [employees, setEmployees] = useState(INIT_EMPLOYEES);
  const [statuses, setStatuses] = useState(INIT_STATUSES);
  const [docTypes, setDocTypes] = useState(INIT_DOC_TYPES);
  const [oppTypes, setOppTypes] = useState(INIT_OPP_TYPES); 
  const [jobRoles, setJobRoles] = useState(INIT_JOB_ROLES);

  useEffect(() => {
    // Initial Load - Simulate fetching
    const sorted = sortOpportunities(MOCK_DATA);
    setOpportunities(sorted);
  }, []);

  const handleOpenModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingOpp(undefined);
    setIsModalOpen(true);
  };

  const handleSave = (opp: Opportunity) => {
    let wasUpdated = false;

    // 1. Try updating in Active List
    setOpportunities(prev => {
        const index = prev.findIndex(o => o.id === opp.id);
        if (index !== -1) {
            wasUpdated = true;
            const updated = [...prev];
            updated[index] = opp;
            return sortOpportunities(updated);
        }
        return prev;
    });

    // 2. Try updating in History List (if it exists there)
    setHistory(prev => {
        const index = prev.findIndex(o => o.id === opp.id);
        if (index !== -1) {
            wasUpdated = true;
            const updated = [...prev];
            updated[index] = opp;
            return updated;
        }
        return prev;
    });

    // 3. If NOT updated in either (and not in trash), it is NEW.
    // Note: We don't support editing directly in trash usually, but logic holds.
    const existsInActive = opportunities.some(o => o.id === opp.id);
    const existsInHistory = history.some(o => o.id === opp.id);

    if (!existsInActive && !existsInHistory) {
        setOpportunities(prev => sortOpportunities([...prev, opp]));
    }
  };

  const handleArchive = (opp: Opportunity) => {
    setConfirmDialog({
        isOpen: true,
        title: "Archivar Oportunidad",
        message: `¿Está seguro que desea mover la oportunidad "${opp.name}" (${opp.account}) a Históricos?`,
        isDestructive: false,
        onConfirm: () => {
            // Safe Update: Prevent duplicates in history and remove from active
            setHistory(prev => {
                if (prev.some(h => h.id === opp.id)) return prev;
                return [opp, ...prev];
            });
            setOpportunities(prev => prev.filter(o => o.id !== opp.id));
        }
    });
  };

  const handleUnarchive = (opp: Opportunity) => {
    setConfirmDialog({
        isOpen: true,
        title: "Restaurar Oportunidad",
        message: `¿Desea restaurar la oportunidad "${opp.name}" a la lista de Activas (ON)?`,
        isDestructive: false,
        onConfirm: () => {
            // Remove from history
            setHistory(prev => prev.filter(h => h.id !== opp.id));
            
            // Add to active
            setOpportunities(prev => {
                if (prev.some(o => o.id === opp.id)) return prev;
                return sortOpportunities([opp, ...prev]);
            });
        }
    });
  };

  const handleRestoreFromTrash = (opp: Opportunity) => {
    setConfirmDialog({
        isOpen: true,
        title: "Recuperar Oportunidad",
        message: `¿Desea recuperar la oportunidad "${opp.name}" de la papelera? Se moverá a la lista de Activas (ON).`,
        isDestructive: false,
        onConfirm: () => {
            // Remove from trash
            setDeletedOpportunities(prev => prev.filter(d => d.id !== opp.id));
            
            // Add to active
            setOpportunities(prev => {
                if (prev.some(o => o.id === opp.id)) return prev;
                return sortOpportunities([opp, ...prev]);
            });
        }
    });
  };

  const handleDelete = (id: number) => {
    if (activeTab === 'TRASH') {
        // PERMANENT DELETE
        setConfirmDialog({
            isOpen: true,
            title: "Eliminar Definitivamente",
            message: "Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta oportunidad para siempre?",
            isDestructive: true,
            onConfirm: () => {
                setDeletedOpportunities(prev => prev.filter(o => o.id !== id));
            }
        });
    } else {
        // SOFT DELETE (Move to Trash)
        const itemToDelete = opportunities.find(o => o.id === id) || history.find(o => o.id === id);
        
        if (itemToDelete) {
             setConfirmDialog({
                isOpen: true,
                title: "Mover a Papelera",
                message: "¿Desea mover esta oportunidad a la papelera de reciclaje?",
                isDestructive: true,
                onConfirm: () => {
                    setDeletedOpportunities(prev => [itemToDelete, ...prev]);
                    setOpportunities(prev => prev.filter(o => o.id !== id));
                    setHistory(prev => prev.filter(o => o.id !== id));
                }
            });
        }
    }
  };

  const runAutoArchive = () => {
    // Implement "MoverFilas" VBA Logic
    const toArchive: Opportunity[] = [];
    const toKeep: Opportunity[] = [];

    opportunities.forEach(opp => {
      if (shouldArchive(opp)) {
        toArchive.push(opp);
      } else {
        toKeep.push(opp);
      }
    });

    if (toArchive.length > 0) {
      setHistory(prev => [...toArchive, ...prev]);
      setOpportunities(sortOpportunities(toKeep));
      alert(`Se han archivado ${toArchive.length} oportunidades automáticamente.`);
    } else {
      alert("No hay filas que cumplan el criterio de archivado.");
    }
  };

  const exportReport = (type: 'Pablo' | 'JP' | 'DC') => {
    alert(`Generando reporte tipo: ${type}...\n(Esta funcionalidad conectaría con la API de generación de Excel)`);
  };

  // Filter Logic
  const getFilteredData = () => {
      let sourceData: Opportunity[] = [];
      if (activeTab === 'ON') sourceData = opportunities;
      else if (activeTab === 'ON-OUT') sourceData = history;
      else if (activeTab === 'TRASH') sourceData = deletedOpportunities;

      if (!searchTerm) return sourceData;
      
      const lowerTerm = searchTerm.toLowerCase();
      return sourceData.filter(item => 
          item.account.toLowerCase().includes(lowerTerm) ||
          item.manager.toLowerCase().includes(lowerTerm) ||
          item.name.toLowerCase().includes(lowerTerm) ||
          (item.responsibleDC && item.responsibleDC.toLowerCase().includes(lowerTerm)) || 
          (item.responsibleBusiness && item.responsibleBusiness.toLowerCase().includes(lowerTerm)) || 
          (item.responsibleTech && item.responsibleTech.toLowerCase().includes(lowerTerm)) || 
          (item.state && item.state.toLowerCase().includes(lowerTerm))
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex justify-between items-center w-[98%] max-w-[1920px]">
            <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-2 rounded text-white">
                    <Layers size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Gestor de Oportunidades</h1>
            </div>
            
            <div className="flex space-x-2">
                 <button 
                    onClick={() => setActiveTab('TRASH')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                        activeTab === 'TRASH' 
                        ? 'bg-red-50 text-red-700 border-red-200 ring-2 ring-red-500 ring-offset-1' 
                        : 'bg-white text-gray-600 border-transparent hover:bg-red-50 hover:text-red-600'
                    }`}
                    title="Papelera de Reciclaje"
                 >
                    <Trash2 size={20} />
                    {deletedOpportunities.length > 0 && (
                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {deletedOpportunities.length}
                        </span>
                    )}
                 </button>
                 <div className="w-px h-8 bg-gray-300 mx-2 self-center"></div>
                 <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 rounded text-sm font-medium"
                    title="Configuración de Entidades"
                 >
                    <Settings size={20} />
                 </button>
                 <button 
                    onClick={runAutoArchive}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium border"
                 >
                    <RefreshCw size={16} />
                    <span>Auto-Archivar</span>
                 </button>
                 <button 
                    onClick={handleNew}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow"
                 >
                    <Plus size={16} />
                    <span>Nueva Oportunidad</span>
                 </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 w-[98%] max-w-[1920px] mx-auto">
        
        {/* Tabs */}
        {activeTab !== 'TRASH' ? (
             <div className="flex space-x-1 mb-4 border-b border-gray-300">
                <button 
                    onClick={() => { setActiveTab('ON'); setSearchTerm(''); }}
                    className={`px-6 py-2 text-sm font-bold rounded-t-lg ${activeTab === 'ON' ? 'bg-white border-x border-t border-gray-300 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                >
                    ON (Activas)
                </button>
                <button 
                    onClick={() => { setActiveTab('ON-OUT'); setSearchTerm(''); }}
                    className={`px-6 py-2 text-sm font-bold rounded-t-lg ${activeTab === 'ON-OUT' ? 'bg-white border-x border-t border-gray-300 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                >
                    ON-OUT (Históricos)
                </button>
            </div>
        ) : (
             <div className="mb-4 pb-2 border-b border-red-200 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-red-700 flex items-center">
                    <Trash2 className="mr-2" size={20}/>
                    Papelera de Reciclaje
                 </h2>
                 <button 
                    onClick={() => setActiveTab('ON')}
                    className="text-sm text-blue-600 hover:underline"
                 >
                    &larr; Volver a Oportunidades
                 </button>
             </div>
        )}

        {/* Toolbar & Search */}
        <div className="mb-4 flex justify-between items-center bg-white p-3 rounded border shadow-sm">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar cuenta, gerente, oportunidad..." 
                    className="pl-9 pr-4 py-1.5 border rounded text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {activeTab === 'ON' && (
                <div className="flex space-x-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider self-center mr-2">Exportar Reportes:</span>
                    <button onClick={() => exportReport('Pablo')} className="px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 flex items-center gap-1">
                        <FileDown size={12}/> Pablo
                    </button>
                    <button onClick={() => exportReport('JP')} className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 flex items-center gap-1">
                        <FileDown size={12}/> JP
                    </button>
                    <button onClick={() => exportReport('DC')} className="px-3 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 flex items-center gap-1">
                        <FileDown size={12}/> DC (SharePoint)
                    </button>
                </div>
            )}
        </div>

        {/* Grid */}
        <OpportunityGrid 
            data={getFilteredData()} 
            onUpdate={handleSave} 
            onOpenDetail={handleOpenModal} 
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onRestore={handleRestoreFromTrash}
            onDelete={handleDelete}
            isHistoryView={activeTab === 'ON-OUT'}
            isTrashView={activeTab === 'TRASH'}
            
            // Catalogs for Dropdowns
            accounts={accounts}
            employees={employees} // Managers are now here
            statuses={statuses}
        />

      </main>

      {/* Edit/Create Modal */}
      <EditModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        initialData={editingOpp}
        isReadOnly={activeTab === 'ON-OUT' || activeTab === 'TRASH'} // ReadOnly in history or trash
        accounts={accounts}
        teams={employees} // Passed as 'teams' prop in EditModal, covers all roles
        statuses={statuses}
        docTypes={docTypes}
        oppTypes={oppTypes}
      />

      {/* Admin Entities Modal */}
      <AdminModal 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        accounts={accounts}
        setAccounts={setAccounts}
        statuses={statuses}
        setStatuses={setStatuses}
        docTypes={docTypes}
        setDocTypes={setDocTypes}
        oppTypes={oppTypes} 
        setOppTypes={setOppTypes} 
        employees={employees}
        setEmployees={setEmployees}
        jobRoles={jobRoles}
        setJobRoles={setJobRoles}
      />

      {/* Custom Confirmation Dialog to bypass Sandbox Restrictions */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all">
                <div className="flex items-center mb-4">
                    {confirmDialog.isDestructive ? (
                        <div className="bg-red-100 p-2 rounded-full mr-3 text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                    ) : (
                        <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                            <RefreshCw size={24} />
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {confirmDialog.message}
                </p>
                
                <div className="flex justify-end space-x-3">
                    <button 
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    >
                        Cancelar
                    </button>
                    <button 
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            confirmDialog.isDestructive 
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                        onClick={() => {
                            confirmDialog.onConfirm();
                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;