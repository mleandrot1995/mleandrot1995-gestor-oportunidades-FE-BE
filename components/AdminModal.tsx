import React, { useState } from 'react';
import { Plus, Trash2, X, Check, AlertCircle, Edit2, Save, Ban } from 'lucide-react';
import { Account, OpportunityStatus, DocumentType, OpportunityType, Employee, JobRole } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    
    accounts: Account[];
    setAccounts: (list: Account[]) => void;
    
    statuses: OpportunityStatus[];
    setStatuses: (list: OpportunityStatus[]) => void;

    docTypes: DocumentType[];
    setDocTypes: (list: DocumentType[]) => void;

    oppTypes: OpportunityType[];
    setOppTypes: (list: OpportunityType[]) => void;

    employees: Employee[];
    setEmployees: (list: Employee[]) => void;

    jobRoles: JobRole[];
    setJobRoles: (list: JobRole[]) => void;
}

type Tab = 'accounts' | 'statuses' | 'doctypes' | 'opptypes' | 'employees' | 'jobroles';

const AdminModal: React.FC<Props> = ({ 
    isOpen, onClose, 
    accounts, setAccounts, 
    statuses, setStatuses,
    docTypes, setDocTypes,
    oppTypes, setOppTypes,
    employees, setEmployees,
    jobRoles, setJobRoles
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('accounts');
    
    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newName, setNewName] = useState('');
    const [newContactName, setNewContactName] = useState('');
    const [newContactEmail, setNewContactEmail] = useState('');
    const [newRole, setNewRole] = useState('');
    const [isActive, setIsActive] = useState(true);

    if (!isOpen) return null;

    const resetForm = () => {
        setEditingId(null);
        setNewName('');
        setNewContactName('');
        setNewContactEmail('');
        setNewRole('');
        setIsActive(true);
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        resetForm();
    };

    const handleLoadEdit = (item: any) => {
        setEditingId(item.id);
        setNewName(item.fullName || item.name || '');
        setIsActive(item.isActive !== undefined ? item.isActive : true);
        
        if (activeTab === 'accounts') {
            setNewContactName(item.contactName || '');
            setNewContactEmail(item.contactEmail || '');
        } else {
            setNewContactName('');
            setNewContactEmail('');
        }

        if (activeTab === 'employees') {
            setNewRole(item.role || '');
        } else {
            setNewRole('');
        }
    };

    const handleSave = () => {
        if (!newName.trim()) return;
        
        // Define IDs
        const idToUse = editingId ?? Date.now();

        // Helper to update list: if editing, map and replace; else push new
        const updateList = <T extends { id: number }>(
            list: T[], 
            setter: (l: T[]) => void, 
            newItem: T
        ) => {
            if (editingId) {
                setter(list.map(item => item.id === editingId ? newItem : item));
            } else {
                setter([...list, newItem]);
            }
        };

        switch(activeTab) {
            case 'accounts':
                updateList(accounts, setAccounts, { 
                    id: idToUse, 
                    name: newName, 
                    contactName: newContactName, 
                    contactEmail: newContactEmail, 
                    isActive 
                });
                break;
            case 'statuses':
                updateList(statuses, setStatuses, { id: idToUse, name: newName });
                break;
            case 'doctypes':
                updateList(docTypes, setDocTypes, { id: idToUse, name: newName });
                break;
            case 'opptypes':
                updateList(oppTypes, setOppTypes, { id: idToUse, name: newName });
                break;
            case 'jobroles':
                updateList(jobRoles, setJobRoles, { id: idToUse, name: newName });
                break;
            case 'employees':
                // For Employees, we validate that a role is selected
                if (!newRole) {
                    alert("Por favor seleccione un puesto");
                    return;
                }
                updateList(employees, setEmployees, { id: idToUse, fullName: newName, role: newRole, isActive });
                break;
        }
        resetForm();
    };

    const handleDelete = (id: number) => {
        if (!window.confirm("¿Seguro que desea eliminar este registro?")) return;
        
        switch(activeTab) {
            case 'accounts': setAccounts(accounts.filter(i => i.id !== id)); break;
            case 'statuses': setStatuses(statuses.filter(i => i.id !== id)); break;
            case 'doctypes': setDocTypes(docTypes.filter(i => i.id !== id)); break;
            case 'opptypes': setOppTypes(oppTypes.filter(i => i.id !== id)); break;
            case 'jobroles': setJobRoles(jobRoles.filter(i => i.id !== id)); break;
            case 'employees': setEmployees(employees.filter(i => i.id !== id)); break;
        }
        
        // If we deleted the item currently being edited, reset form
        if (editingId === id) {
            resetForm();
        }
    };

    const toggleActive = (id: number) => {
        const toggle = (list: any[], setter: any) => {
            setter(list.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
        };

        switch(activeTab) {
            case 'accounts': toggle(accounts, setAccounts); break;
            case 'employees': toggle(employees, setEmployees); break;
        }
    };

    const renderTabs = () => (
        <div className="flex space-x-1 border-b overflow-x-auto">
            {[
                { id: 'accounts', label: 'Cuentas' },
                { id: 'statuses', label: 'Estados' },
                { id: 'doctypes', label: 'Tipos Doc.' },
                { id: 'opptypes', label: 'Tipos ON' },
                { id: 'jobroles', label: 'Puestos' },
                { id: 'employees', label: 'Empleados' },
            ].map(tab => (
                <button 
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id as Tab)}
                    className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 h-[650px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Administración de Entidades (ABMC)</h2>
                    <button onClick={onClose} type="button" className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {renderTabs()}

                {/* Form Area */}
                <div className={`mt-4 p-4 rounded border ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold text-gray-700">
                            {editingId ? 'Editando Registro' : 'Nuevo Registro'}
                         </h3>
                         {editingId && (
                             <button 
                                onClick={resetForm} 
                                type="button"
                                className="text-xs flex items-center text-red-600 hover:text-red-800"
                             >
                                <Ban size={12} className="mr-1"/> Cancelar Edición
                             </button>
                         )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input 
                            type="text" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={activeTab === 'accounts' ? "Nombre Cliente" : "Nombre"}
                            className="border rounded px-3 py-2 text-sm w-full bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                        />
                        
                        {activeTab === 'accounts' && (
                            <>
                                <input 
                                    type="text" 
                                    value={newContactName}
                                    onChange={(e) => setNewContactName(e.target.value)}
                                    placeholder="Nombre Contacto"
                                    className="border rounded px-3 py-2 text-sm w-full bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                                />
                                <input 
                                    type="email" 
                                    value={newContactEmail}
                                    onChange={(e) => setNewContactEmail(e.target.value)}
                                    placeholder="Mail Contacto"
                                    className="border rounded px-3 py-2 text-sm w-full bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                                />
                            </>
                        )}
                        
                        {activeTab === 'employees' && (
                             <select 
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="border rounded px-3 py-2 text-sm w-full bg-gray-700 text-white border-gray-600"
                            >
                                <option value="">Seleccionar Puesto...</option>
                                {jobRoles.map(r => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        )}

                        {(activeTab !== 'statuses' && activeTab !== 'doctypes' && activeTab !== 'opptypes' && activeTab !== 'jobroles') && (
                            <div className="flex items-center">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Activo</span>
                                </label>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleSave}
                        type="button"
                        disabled={!newName}
                        className={`w-full p-2 rounded text-sm font-medium flex justify-center items-center ${editingId ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300'}`}
                    >
                        {editingId ? <Save size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />} 
                        {editingId ? 'Guardar Cambios' : `Agregar ${activeTab === 'accounts' ? 'Cuenta' : 'Registro'}`}
                    </button>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto mt-4 border rounded">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-medium border-b sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2">Nombre</th>
                                {(activeTab === 'accounts') && <th className="px-4 py-2">Contacto</th>}
                                {(activeTab === 'employees') && <th className="px-4 py-2">Puesto</th>}
                                {(activeTab !== 'statuses' && activeTab !== 'doctypes' && activeTab !== 'opptypes' && activeTab !== 'jobroles') && <th className="px-4 py-2 text-center">Estado</th>}
                                <th className="px-4 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">

                            {/* ACCOUNTS */}
                            {activeTab === 'accounts' && accounts.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        <div className="font-medium">{a.name}</div>
                                        <div className="text-xs text-gray-500">{a.contactEmail}</div>
                                    </td>
                                    <td className="px-4 py-2">{a.contactName || '-'}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button type="button" onClick={() => toggleActive(a.id)} className={`px-2 py-0.5 rounded text-xs ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {a.isActive ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button type="button" onClick={() => handleLoadEdit(a)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                                            <button type="button" onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* STATUSES */}
                            {activeTab === 'statuses' && statuses.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{s.name}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button type="button" onClick={() => handleLoadEdit(s)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                                            <button type="button" onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* DOC TYPES */}
                            {activeTab === 'doctypes' && docTypes.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{d.name}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button type="button" onClick={() => handleLoadEdit(d)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                                            <button type="button" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* OPP TYPES */}
                            {activeTab === 'opptypes' && oppTypes.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{d.name}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button type="button" onClick={() => handleLoadEdit(d)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                                            <button type="button" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* JOB ROLES */}
                            {activeTab === 'jobroles' && jobRoles.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{r.name}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button type="button" onClick={() => handleLoadEdit(r)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                                            <button type="button" onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* EMPLOYEES */}
                            {activeTab === 'employees' && employees.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{e.fullName}</td>
                                    <td className="px-4 py-2 text-gray-600 text-xs">{e.role}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button type="button" onClick={() => toggleActive(e.id)} className={`px-2 py-0.5 rounded text-xs ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {e.isActive ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button type="button" onClick={() => handleLoadEdit(e)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                                            <button type="button" onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;