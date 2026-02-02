import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, RotateCcw, Menu, ChevronRight, Search, Check, Save, Settings } from 'lucide-react';
import { Account, OpportunityStatus, OpportunityType, Employee, JobRole, Motive, Industry } from '../types/types';
import * as api from '../api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Estado inicial para el formulario, previene errores de "uncontrolled to controlled"
const initialFormData = {
    name: '',
    contact_name: '',
    contact_email: '',
    is_active: true,
    industry_id: '',
    full_name: '',
    role_id: ''
};

const AdminModal: React.FC<Props> = ({ isOpen, onClose }) => {
    // --- ESTADOS ---
    const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'statuses' | 'oppTypes' | 'roles' | 'employees' | 'motives' | 'industries' | 'teamRoles' | 'seniorities' | 'technologies'>('accounts');
    
    // Listas de datos
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [statuses, setStatuses] = useState<OpportunityStatus[]>([]);
    const [oppTypes, setOppTypes] = useState<OpportunityType[]>([]);
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [motives, setMotives] = useState<Motive[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [teamRoles, setTeamRoles] = useState<any[]>([]);
    const [seniorities, setSeniorities] = useState<any[]>([]);
    const [technologies, setTechnologies] = useState<any[]>([]);

    // Estado de formularios y edición
    const [formData, setFormData] = useState<any>(initialFormData);
    const [searchTerm, setSearchTerm] = useState('');
    const [inlineEditId, setInlineEditId] = useState<number | null>(null);
    const [inlineData, setInlineData] = useState<any>({});

    // --- EFECTOS Y CARGA DE DATOS ---
    const fetchData = async () => {
        try {
            const [acc, sta, opp, rol, emp, mot, ind, tRol, sen, tec] = await Promise.all([
                api.getAccounts(), api.getStatuses(), api.getOppTypes(),
                api.getJobRoles(), api.getEmployees(), api.getMotives(), api.getIndustries(),
                api.fetchApi('/team-roles'), api.fetchApi('/seniorities'), api.fetchApi('/technologies')
            ]);
            setAccounts(acc);
            setStatuses(sta);
            setOppTypes(opp);
            setRoles(rol);
            setEmployees(emp);
            setMotives(mot);
            setIndustries(ind);
            setTeamRoles(tRol);
            setSeniorities(sen);
            setTechnologies(tec);
        } catch (err) {
            console.error("Error cargando datos del catálogo:", err);
            alert("Hubo un error al cargar los catálogos. Revise la consola.");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        resetForm();
    }, [activeSubTab]);

    const resetForm = () => {
        setInlineEditId(null);
        setInlineData({});
        setSearchTerm('');
        
        if (activeSubTab === 'accounts') {
            setFormData({ name: '', contact_name: '', contact_email: '', is_active: true, industry_id: '' });
        } else if (activeSubTab === 'employees') {
            setFormData({ full_name: '', role_id: '', is_active: true });
        } else if (['teamRoles', 'seniorities', 'technologies'].includes(activeSubTab)) {
            setFormData({ name: '', is_active: true });
        } else {
            setFormData({ name: '' });
        }
    };

    // --- MANEJO DE ACCIONES ---
    const handleSave = async (isInline = false) => {
        try {
            const entityMap: any = {
                accounts: 'accounts', statuses: 'statuses', oppTypes: 'opp-types',
                roles: 'job-roles', employees: 'employees', motives: 'motives', industries: 'industries',
                teamRoles: 'team-roles', seniorities: 'seniorities', technologies: 'technologies'
            };
            const endpoint = entityMap[activeSubTab];
            let dataToSave = isInline ? inlineData : formData;

            // Limpieza de datos antes de enviar
            if ('industry_id' in dataToSave) dataToSave.industry_id = dataToSave.industry_id ? parseInt(dataToSave.industry_id, 10) : null;
            if ('role_id' in dataToSave) dataToSave.role_id = dataToSave.role_id ? parseInt(dataToSave.role_id, 10) : null;

            if (isInline && inlineEditId) {
                 await api.updateEntity(endpoint, inlineEditId, dataToSave);
                 setInlineEditId(null);
            } else {
                await api.createEntity(endpoint, dataToSave);
                resetForm();
            }
            fetchData();
        } catch (err: any) {
            alert(`Error al guardar: ${err.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Confirmas la eliminación de este registro?')) return;
        try {
            const entityMap: any = {
                accounts: 'accounts', statuses: 'statuses', oppTypes: 'opp-types',
                roles: 'job-roles', employees: 'employees', motives: 'motives', industries: 'industries',
                teamRoles: 'team-roles', seniorities: 'seniorities', technologies: 'technologies'
            };
            await api.deleteEntity(entityMap[activeSubTab], id);
            fetchData();
        } catch (err: any) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };
    
    const startInlineEdit = (item: any) => {
        setInlineEditId(item.id);
        setInlineData({ ...item });
        setFormData(initialFormData); // Reset top form
    };

    const getFilteredList = () => {
        let list: any[] = [];
        if (activeSubTab === 'accounts') list = accounts;
        else if (activeSubTab === 'statuses') list = statuses;
        else if (activeSubTab === 'oppTypes') list = oppTypes;
        else if (activeSubTab === 'roles') list = roles;
        else if (activeSubTab === 'employees') list = employees;
        else if (activeSubTab === 'motives') list = motives;
        else if (activeSubTab === 'industries') list = industries;
        else if (activeSubTab === 'teamRoles') list = teamRoles;
        else if (activeSubTab === 'seniorities') list = seniorities;
        else if (activeSubTab === 'technologies') list = technologies;

        if (!searchTerm) return list;

        return list.filter((item: any) => {
            const name = item.name || item.full_name || '';
            const contactName = item.contact_name || '';
            const contactEmail = item.contact_email || '';
            const industryName = item.industry_name || '';
            const roleName = item.role_name || '';
            
            const lowerSearch = searchTerm.toLowerCase();

            return name.toLowerCase().includes(lowerSearch) ||
                   contactName.toLowerCase().includes(lowerSearch) ||
                   contactEmail.toLowerCase().includes(lowerSearch) ||
                   industryName.toLowerCase().includes(lowerSearch) ||
                   roleName.toLowerCase().includes(lowerSearch);
        });
    };
    
    // --- RENDERIZADO ---
    if (!isOpen) return null;

    const navItemClasses = (id: string) => `w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider flex items-center justify-between transition-all ${activeSubTab === id ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`;
    const inputClasses = "bg-gray-100 border border-gray-200 text-gray-800 text-[12px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full placeholder:text-gray-400 disabled:opacity-50 transition-all";
    const headerTh = "text-slate-500 font-black text-[10px] px-3 py-2 text-left bg-slate-100 uppercase tracking-wider border-b border-slate-200";
    const inlineInputClass = "bg-white border border-gray-300 text-gray-800 text-[11px] rounded px-2 py-1 outline-none focus:border-blue-500 w-full h-7";
    const statusBadgeClass = (isActive: boolean) => `px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;

    const renderForm = () => {
        switch(activeSubTab) {
            case 'accounts':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input className={inputClasses} placeholder="Nombre Cliente" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <select className={inputClasses} value={formData.industry_id || ''} onChange={e => setFormData({...formData, industry_id: e.target.value})}>
                                <option value="">Seleccionar Industria...</option>
                                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input className={inputClasses} placeholder="Nombre Contacto" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                            <input className={inputClasses} type="email" placeholder="Mail Contacto" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} />
                        </div>
                        <div className="flex items-center gap-2 pl-1 pt-1">
                            <input type="checkbox" id="active-acc" className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 ring-offset-white" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                            <label htmlFor="active-acc" className="text-[11px] font-bold text-gray-700 uppercase cursor-pointer select-none">Activo</label>
                        </div>
                    </>
                );
            case 'employees':
                 return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input className={inputClasses} placeholder="Nombre Completo" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                            <select className={inputClasses} value={formData.role_id || ''} onChange={e => setFormData({...formData, role_id: e.target.value})}>
                                <option value="">Seleccionar Puesto...</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 pl-1 pt-1">
                            <input type="checkbox" id="active-emp" className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 ring-offset-white" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                            <label htmlFor="active-emp" className="text-[11px] font-bold text-gray-700 uppercase cursor-pointer select-none">Activo</label>
                        </div>
                    </>
                );
            default:
                return (
                    <div className="space-y-3">
                        <input className={inputClasses} placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        {['teamRoles', 'seniorities', 'technologies'].includes(activeSubTab) && (
                            <div className="flex items-center gap-2 pl-1 pt-1">
                                <input type="checkbox" id="active-generic" className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500" 
                                       checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                <label htmlFor="active-generic" className="text-[11px] font-bold text-gray-700 uppercase cursor-pointer select-none">Activo</label>
                            </div>
                        )}
                    </div>
                );
        }
    }
    
    const renderTableBody = () => {
        const list = getFilteredList();

        if (list.length === 0) {
            return (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 text-sm">
                        No hay registros para mostrar.
                    </td>
                </tr>
            );
        }

        return list.map((item: any) => (
            <tr key={item.id} className={`hover:bg-blue-50/50 transition-colors text-[12px] text-gray-700`}>
                
                {/* --- Columna Nombre --- */}
                <td className="px-3 py-2 font-medium text-gray-900">
                    {inlineEditId === item.id ? (
                        <input className={inlineInputClass} value={inlineData.name || inlineData.full_name} 
                               onChange={e => setInlineData({ ...inlineData, ...(activeSubTab === 'employees' ? {full_name: e.target.value} : {name: e.target.value}) })} />
                    ) : (
                        item.name || item.full_name
                    )}
                </td>

                {/* --- Columnas Específicas --- */}
                {activeSubTab === 'accounts' && (
                    <>
                        <td className="px-3 py-2 text-gray-600">
                            {inlineEditId === item.id ? (
                                <select className={inlineInputClass} value={inlineData.industry_id || ''} onChange={e => setInlineData({ ...inlineData, industry_id: e.target.value })}>
                                    <option value="">Sin especificar</option>
                                    {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            ) : (
                                item.industry_name || <span className="text-gray-400">-</span>
                            )}
                        </td>
                        <td className="px-3 py-2">
                             {inlineEditId === item.id ? (
                                <>
                                    <input className={`${inlineInputClass} mb-1`} placeholder="Contacto" value={inlineData.contact_name} onChange={e => setInlineData({ ...inlineData, contact_name: e.target.value })} />
                                    <input className={inlineInputClass} placeholder="Email" value={inlineData.contact_email} onChange={e => setInlineData({ ...inlineData, contact_email: e.target.value })} />
                                </>
                             ) : (
                                <div>
                                    <div className="font-medium">{item.contact_name || <span className="text-gray-400">-</span>}</div>
                                    <div className="text-gray-500">{item.contact_email}</div>
                                </div>
                             )}
                        </td>
                    </>
                )}
                {activeSubTab === 'employees' && (
                    <td className="px-3 py-2 text-gray-600">
                         {inlineEditId === item.id ? (
                                <select className={inlineInputClass} value={inlineData.role_id || ''} onChange={e => setInlineData({ ...inlineData, role_id: e.target.value })}>
                                    <option value="">Sin especificar</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            ) : (
                                item.role_name || <span className="text-gray-400">-</span>
                            )}
                    </td>
                )}
                
                {/* --- Columna Estado --- */}
                {(['accounts', 'employees', 'teamRoles', 'seniorities', 'technologies'].includes(activeSubTab)) && (
                    <td className="px-3 py-2 text-center">
                        {inlineEditId === item.id ? (
                             <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={inlineData.is_active} onChange={e => setInlineData({ ...inlineData, is_active: e.target.checked })} />
                        ) : (
                            <span className={statusBadgeClass(item.is_active)}>
                                {item.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        )}
                    </td>
                )}

                {/* --- Columna Acciones --- */}
                <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                        {inlineEditId === item.id ? (
                             <>
                                <button onClick={() => handleSave(true)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-md"><Check size={14} /></button>
                                <button onClick={() => setInlineEditId(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md"><X size={14} /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => startInlineEdit(item)} title="Editar en línea" className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(item.id)} title="Eliminar" className="p-1.5 text-red-500 hover:bg-red-100 rounded-md"><Trash2 size={14} /></button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        ));
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden border border-gray-200">
                
                <div className="w-56 bg-white border-r border-gray-100 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow"><Settings size={16} /></div>
                        <span className="font-black text-gray-800 text-xs uppercase tracking-tight">Catálogos</span>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-2">
                        <button onClick={() => setActiveSubTab('accounts')} className={navItemClasses('accounts')}>Cuentas {activeSubTab === 'accounts' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('statuses')} className={navItemClasses('statuses')}>Estados {activeSubTab === 'statuses' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('oppTypes')} className={navItemClasses('oppTypes')}>Tipos ON {activeSubTab === 'oppTypes' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('roles')} className={navItemClasses('roles')}>Puestos Preventa {activeSubTab === 'roles' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('employees')} className={navItemClasses('employees')}>Empleados {activeSubTab === 'employees' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('motives')} className={navItemClasses('motives')}>Motivos {activeSubTab === 'motives' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('industries')} className={navItemClasses('industries')}>Industrias {activeSubTab === 'industries' && <ChevronRight size={14}/>}</button>
                        <div className="mt-4 px-4 py-2 text-[9px] font-black text-gray-400 uppercase border-t border-gray-100">Equipo Proyecto</div>
                        <button onClick={() => setActiveSubTab('teamRoles')} className={navItemClasses('teamRoles')}>Roles Proyecto {activeSubTab === 'teamRoles' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('seniorities')} className={navItemClasses('seniorities')}>Seniorities {activeSubTab === 'seniorities' && <ChevronRight size={14}/>}</button>
                        <button onClick={() => setActiveSubTab('technologies')} className={navItemClasses('technologies')}>Tecnologías {activeSubTab === 'technologies' && <ChevronRight size={14}/>}</button>
                    </nav>
                </div>

                <div className="flex-1 flex flex-col bg-gray-50/50">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm">
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                            Administrar: {activeSubTab === 'accounts' ? 'Cuentas' : 
                                       activeSubTab === 'statuses' ? 'Estados' : 
                                       activeSubTab === 'oppTypes' ? 'Tipos de Oportunidad' : 
                                       activeSubTab === 'roles' ? 'Puestos Laborales' : 
                                       activeSubTab === 'motives' ? 'Motivos de Rechazo' : 
                                       activeSubTab === 'industries' ? 'Industrias' : 
                                       activeSubTab === 'teamRoles' ? 'Roles de Proyecto' :
                                       activeSubTab === 'seniorities' ? 'Seniorities' :
                                       activeSubTab === 'technologies' ? 'Tecnologías' : 'Empleados'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* --- FORMULARIO SUPERIOR --- */}
                        <div className='p-6 space-y-6 bg-gray-100/80 border-b border-gray-200'>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-gray-800 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                        <Plus size={14}/>
                                        Nuevo Registro
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    {renderForm()}
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button onClick={() => handleSave(false)} className="bg-blue-600 text-white font-bold text-[11px] uppercase px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!formData.name && !formData.full_name}>
                                            <Plus size={14} />
                                            Crear Registro
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- TABLA DE DATOS --- */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="text" placeholder="Buscar en la lista..."
                                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 font-medium bg-white transition-all"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className={headerTh}>Nombre</th>
                                                {activeSubTab === 'accounts' && <th className={headerTh}>Industria</th>}
                                                {activeSubTab === 'accounts' && <th className={headerTh}>Contacto</th>}
                                                {activeSubTab === 'employees' && <th className={headerTh}>Puesto</th>}
                                                {(['accounts', 'employees', 'teamRoles', 'seniorities', 'technologies'].includes(activeSubTab)) && <th className={`${headerTh} text-center`}>Estado</th>}
                                                <th className={`${headerTh} text-right w-32`}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {renderTableBody()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;