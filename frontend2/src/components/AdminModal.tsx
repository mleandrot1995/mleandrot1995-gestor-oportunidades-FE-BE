import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { Account, OpportunityStatus, DocumentType, OpportunityType, Employee, JobRole, Motive } from '../types/types';
import * as api from '../api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const AdminModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'statuses' | 'docTypes' | 'oppTypes' | 'roles' | 'employees' | 'motives'>('accounts');
    
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [statuses, setStatuses] = useState<OpportunityStatus[]>([]);
    const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
    const [oppTypes, setOppTypes] = useState<OpportunityType[]>([]);
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [motives, setMotives] = useState<Motive[]>([]);

    const [formData, setFormData] = useState<any>({});
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const [acc, sta, doc, opp, rol, emp, mot] = await Promise.all([
                api.getAccounts(),
                api.getStatuses(),
                api.getDocTypes(),
                api.getOppTypes(),
                api.getJobRoles(),
                api.getEmployees(),
                api.fetchApi('/motives')
            ]);
            setAccounts(acc);
            setStatuses(sta);
            setDocTypes(doc);
            setOppTypes(opp);
            setRoles(rol);
            setEmployees(emp);
            setMotives(mot);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
            resetForm();
        }
    }, [isOpen, activeSubTab]);

    const resetForm = () => {
        setEditingId(null);
        if (activeSubTab === 'accounts') {
            setFormData({ name: '', contact_name: '', contact_email: '', is_active: true });
        } else if (activeSubTab === 'employees') {
            setFormData({ full_name: '', role_id: '', is_active: true });
        } else {
            setFormData({ name: '' });
        }
    };

    const handleSave = async () => {
        try {
            const entityMap: any = {
                accounts: 'accounts',
                statuses: 'statuses',
                docTypes: 'doc-types',
                oppTypes: 'opp-types',
                roles: 'job-roles',
                employees: 'employees',
                motives: 'motives'
            };
            const endpoint = entityMap[activeSubTab];

            if (editingId) {
                await api.updateEntity(endpoint, editingId, formData);
            } else {
                await api.createEntity(endpoint, formData);
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Seguro?')) return;
        try {
            const entityMap: any = {
                accounts: 'accounts',
                statuses: 'statuses',
                docTypes: 'doc-types',
                oppTypes: 'opp-types',
                roles: 'job-roles',
                employees: 'employees',
                motives: 'motives'
            };
            await api.deleteEntity(entityMap[activeSubTab], id);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({ ...item });
    };

    if (!isOpen) return null;

    const tabClasses = (id: string) => `px-3 py-2 text-[12px] font-bold transition-all border-b-2 whitespace-nowrap ${activeSubTab === id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`;
    const inputClasses = "bg-[#3f4b5b] border-none text-white text-[12px] rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 w-full placeholder:text-gray-400 disabled:opacity-50";
    const headerTh = "text-[#495057] font-black text-[11px] px-3 py-2 text-left bg-[#f8f9fa] uppercase tracking-wider";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                
                {/* Tabs */}
                <div className="flex border-b overflow-x-auto bg-white sticky top-0 z-10 scrollbar-hide">
                    <button onClick={() => setActiveSubTab('accounts')} className={tabClasses('accounts')}>Cuentas</button>
                    <button onClick={() => setActiveSubTab('statuses')} className={tabClasses('statuses')}>Estados</button>
                    <button onClick={() => setActiveSubTab('docTypes')} className={tabClasses('docTypes')}>Documentos</button>
                    <button onClick={() => setActiveSubTab('oppTypes')} className={tabClasses('oppTypes')}>Tipos ON</button>
                    <button onClick={() => setActiveSubTab('roles')} className={tabClasses('roles')}>Puestos</button>
                    <button onClick={() => setActiveSubTab('employees')} className={tabClasses('employees')}>Empleados</button>
                    <button onClick={() => setActiveSubTab('motives')} className={tabClasses('motives')}>Motivos</button>
                    <button onClick={onClose} className="ml-auto px-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    
                    {/* Nuevo Registro Section */}
                    <div className="border rounded-lg p-4 bg-white shadow-sm border-gray-100 relative">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[#333] font-black text-[13px] uppercase tracking-widest">
                                {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                            </h3>
                            {editingId && (
                                <button onClick={resetForm} className="text-red-500 text-[10px] font-bold flex items-center gap-1 hover:underline uppercase">
                                    <RotateCcw size={10}/> Cancelar Edición
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {activeSubTab === 'accounts' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className={inputClasses} placeholder="Nombre Cliente" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                        <input className={inputClasses} placeholder="Nombre Contacto" value={formData.contact_name || ''} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                        <input className={inputClasses} placeholder="Mail Contacto" value={formData.contact_email || ''} onChange={e => setFormData({...formData, contact_email: e.target.value})} />
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="active-acc" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                            <label htmlFor="active-acc" className="text-[11px] font-bold text-gray-700 uppercase">Activo</label>
                                        </div>
                                    </div>
                                </>
                            ) : activeSubTab === 'employees' ? (
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className={inputClasses} placeholder="Nombre Completo" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                                        <select className={inputClasses} value={formData.role_id || ''} onChange={e => setFormData({...formData, role_id: parseInt(e.target.value)})}>
                                            <option value="">Seleccionar Puesto...</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="active-emp" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                        <label htmlFor="active-emp" className="text-[11px] font-bold text-gray-700 uppercase">Activo</label>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    <input className={inputClasses} placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                {editingId && (
                                    <button onClick={resetForm} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 font-black py-2 rounded text-[11px] uppercase tracking-widest transition-all">
                                        Cancelar
                                    </button>
                                )}
                                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2 rounded text-[11px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2">
                                    {editingId ? <Edit2 size={14}/> : <Plus size={16}/>} 
                                    {editingId ? 'Actualizar' : `Agregar ${activeSubTab === 'accounts' ? 'Cuenta' : 'Registro'}`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm border-gray-100">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className={headerTh}>Nombre</th>
                                    {activeSubTab === 'accounts' && <th className={headerTh}>Contacto</th>}
                                    {activeSubTab === 'employees' && <th className={headerTh}>Puesto</th>}
                                    {(activeSubTab === 'accounts' || activeSubTab === 'employees') && <th className={`${headerTh} text-center`}>Estado</th>}
                                    <th className={`${headerTh} text-right w-20`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[12px]">
                                {(activeSubTab === 'accounts' ? accounts :
                                  activeSubTab === 'statuses' ? statuses :
                                  activeSubTab === 'docTypes' ? docTypes :
                                  activeSubTab === 'oppTypes' ? oppTypes :
                                  activeSubTab === 'roles' ? roles : 
                                  activeSubTab === 'motives' ? motives : employees).map((item: any) => (
                                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${editingId === item.id ? 'bg-blue-50' : ''}`}>
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-gray-800">{item.name || item.full_name}</div>
                                        </td>
                                        {activeSubTab === 'accounts' && (
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-gray-700">{item.contact_name || '-'}</div>
                                                {item.contact_email && <div className="text-[10px] text-gray-400 font-medium">{item.contact_email}</div>}
                                            </td>
                                        )}
                                        {activeSubTab === 'employees' && <td className="px-3 py-2 text-gray-600">{item.role_name || '-'}</td>}
                                        {(activeSubTab === 'accounts' || activeSubTab === 'employees') && (
                                            <td className="px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.is_active ? 'Sí' : 'No'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(item)} className={`p-1 rounded transition-all ${editingId === item.id ? 'text-blue-700 bg-blue-100' : 'text-blue-500 hover:bg-blue-50'}`}><Edit2 size={14}/></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;
