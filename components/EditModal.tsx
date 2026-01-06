
import React, { useState, useEffect } from 'react';
import { Opportunity, CellColor, OpportunityState, Account, OpportunityStatus, DocumentType, OpportunityType, Employee, ObservationItem } from '../types';
import { validateColorVsPercentage, calculateProposalGenerationTime } from '../utils/businessLogic';
import { AlertCircle, Lock, Calendar, Link as LinkIcon, Clock, Plus, MessageSquare, Trash2, FileText, Sparkles, Layout, X, Info } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (opp: Opportunity) => void;
    initialData?: Opportunity;
    isReadOnly?: boolean;
    
    // Catalogos
    accounts: Account[];
    teams: Employee[]; 
    statuses: OpportunityStatus[];
    docTypes: DocumentType[];
    oppTypes: OpportunityType[];
}

const EditModal: React.FC<Props> = ({ 
    isOpen, onClose, onSave, initialData, isReadOnly,
    accounts, teams, statuses, docTypes, oppTypes
}) => {
    const [formData, setFormData] = useState<Partial<Opportunity>>({});
    const [error, setError] = useState<string | null>(null);
    const [newObservationText, setNewObservationText] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                id: Math.floor(Math.random() * 10000),
                startDate: new Date().toISOString().split('T')[0],
                percentage: 0,
                color: CellColor.NONE,
                state: OpportunityState.EVALUACION,
                observationHistory: [],
                isAIProposal: false,
                isPrototypeProposal: false,
                kRedIndex: 0,
                orderIndex: 0
            });
        }
        setError(null);
        setNewObservationText('');
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field: keyof Opportunity, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (field === 'color' || field === 'percentage') {
            const newColor = field === 'color' ? value : formData.color;
            const newPct = field === 'percentage' ? parseInt(value) : formData.percentage;
            
            if (newColor && newPct !== undefined) {
                const validation = validateColorVsPercentage(newColor, newPct);
                if (!validation.isValid) {
                    setError(validation.message || "Error");
                } else {
                    setError(null);
                }
            }
        }
    };

    const handleAddObservation = () => {
        if (!newObservationText.trim()) return;
        const today = new Date().toISOString().split('T')[0];
        const newEntry: ObservationItem = { date: today, text: newObservationText.trim() };
        const updatedHistory = [newEntry, ...(formData.observationHistory || [])];
        setFormData(prev => ({
            ...prev,
            observationHistory: updatedHistory,
            observations: newObservationText.trim()
        }));
        setNewObservationText('');
    };

    const handleDeleteObservation = (index: number) => {
        if (isReadOnly) return;
        const currentHistory = [...(formData.observationHistory || [])];
        currentHistory.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            observationHistory: currentHistory,
            observations: index === 0 ? (currentHistory[0]?.text || '') : prev.observations
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateColorVsPercentage(formData.color as CellColor, formData.percentage || 0);
        if(!validation.isValid) {
            setError(validation.message || "Error de validación");
            return;
        }

        const dataToSave = { ...formData };
        if (newObservationText.trim()) {
             const today = new Date().toISOString().split('T')[0];
             const newEntry = { date: today, text: newObservationText.trim() };
             dataToSave.observationHistory = [newEntry, ...(formData.observationHistory || [])];
             dataToSave.observations = newObservationText.trim();
        }

        onSave(dataToSave as Opportunity);
        onClose();
    };

    const propTime = calculateProposalGenerationTime(formData.scopeDate, formData.realDeliveryDate);

    const labelClass = "block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider";
    const inputClass = "w-full border rounded-xl p-2.5 text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium";
    const sectionTitleClass = "text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2 mb-4 flex items-center gap-2";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl p-8 max-h-[95vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b pb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isReadOnly ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}>
                            {isReadOnly ? <Lock size={24}/> : <FileText size={24}/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                {isReadOnly ? 'Vista de Detalle' : (initialData ? `Editar Oportunidad #${initialData.id}` : 'Nueva Oportunidad')}
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Gestión de Pipeline Comercial</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <X size={28} className="text-gray-400 group-hover:text-gray-600"/>
                    </button>
                </div>
                
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center font-bold text-sm animate-pulse">
                        <AlertCircle size={20} className="mr-3 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        
                        {/* SECCIÓN 1: IDENTIFICACIÓN Y GENERAL */}
                        <div className="space-y-6">
                            <h3 className={sectionTitleClass}><Info size={14}/> Datos Generales</h3>
                            
                            <div>
                                <label className={labelClass}>Cuenta / Cliente</label>
                                <select className={inputClass} value={formData.account || ''} onChange={e => handleChange('account', e.target.value)} required disabled={isReadOnly}>
                                    <option value="">Seleccionar...</option>
                                    {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Nombre de la Oportunidad</label>
                                <input type="text" className={`${inputClass} font-bold text-gray-900`} value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required disabled={isReadOnly} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Tipo de Documento</label>
                                    <select className={inputClass} value={formData.documentType || ''} onChange={e => handleChange('documentType', e.target.value)} disabled={isReadOnly}>
                                        <option value="">Seleccionar...</option>
                                        {docTypes.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Tipo Oportunidad</label>
                                    <select className={inputClass} value={formData.opportunityType || ''} onChange={e => handleChange('opportunityType', e.target.value)} disabled={isReadOnly}>
                                        <option value="">Seleccionar...</option>
                                        {oppTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 transition-all" checked={formData.isAIProposal} onChange={e => handleChange('isAIProposal', e.target.checked)} disabled={isReadOnly} />
                                    <span className="text-xs font-black text-gray-700 group-hover:text-purple-700 flex items-center transition-colors">
                                        <Sparkles size={14} className="mr-2 text-purple-500"/> PROPUESTA CON IA
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all" checked={formData.isPrototypeProposal} onChange={e => handleChange('isPrototypeProposal', e.target.checked)} disabled={isReadOnly} />
                                    <span className="text-xs font-black text-gray-700 group-hover:text-indigo-700 flex items-center transition-colors">
                                        <Layout size={14} className="mr-2 text-indigo-500"/> INCLUYE PROTOTIPO
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* SECCIÓN 2: PIPELINE, SEMÁFORO Y EQUIPO */}
                        <div className="space-y-6">
                            <h3 className={sectionTitleClass}><Sparkles size={14}/> Pipeline y Responsables</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Probabilidad (%)</label>
                                    <input type="number" className={`${inputClass} text-center font-black text-blue-600 text-sm`} value={formData.percentage} onChange={e => handleChange('percentage', parseInt(e.target.value))} required disabled={isReadOnly} />
                                </div>
                                <div>
                                    <label className={labelClass}>Semáforo</label>
                                    <select className={`${inputClass} font-bold`} value={formData.color || CellColor.NONE} onChange={e => handleChange('color', e.target.value)} disabled={isReadOnly}>
                                        <option value={CellColor.NONE}>Normal (S/C)</option>
                                        <option value={CellColor.RED}>Rojo (Peligro)</option>
                                        <option value={CellColor.YELLOW}>Amarillo (Alerta)</option>
                                        <option value={CellColor.GREEN}>Verde (Óptimo)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className={labelClass}>Estado Actual</label>
                                    <select className={`${inputClass} font-black text-blue-700 uppercase`} value={formData.state || ''} onChange={e => handleChange('state', e.target.value)} required disabled={isReadOnly}>
                                        {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className={labelClass}>Motivo / Razón</label>
                                    <input type="text" className={inputClass} placeholder="Ej: Precio, Alcance..." value={formData.reason || ''} onChange={e => handleChange('reason', e.target.value)} disabled={isReadOnly} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className={labelClass}>Gerente Comercial</label>
                                    <select className={inputClass} value={formData.manager || ''} onChange={e => handleChange('manager', e.target.value)} required disabled={isReadOnly}>
                                        <option value="">Seleccionar Gerente...</option>
                                        {teams.filter(e => e.role === 'Gerente Comercial').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className={labelClass}>Responsable DC</label>
                                        <select className={inputClass} value={formData.responsibleDC || ''} onChange={e => handleChange('responsibleDC', e.target.value)} disabled={isReadOnly}>
                                            <option value="">Seleccionar DC...</option>
                                            {teams.filter(e => e.role === 'DC').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Responsable Negocio</label>
                                        <select className={inputClass} value={formData.responsibleBusiness || ''} onChange={e => handleChange('responsibleBusiness', e.target.value)} disabled={isReadOnly}>
                                            <option value="">Seleccionar Negocio...</option>
                                            {teams.filter(e => e.role === 'Analista de Negocios').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Responsable Técnico</label>
                                        <select className={inputClass} value={formData.responsibleTech || ''} onChange={e => handleChange('responsibleTech', e.target.value)} disabled={isReadOnly}>
                                            <option value="">Seleccionar Técnico...</option>
                                            {teams.filter(e => e.role === 'Responsable Técnico').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: CRONOGRAMA Y KPIs */}
                        <div className="space-y-6">
                            <h3 className={sectionTitleClass}><Calendar size={14}/> Cronograma y KPIs</h3>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                                <div className="col-span-2 flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Fechas del Proceso</span>
                                    {propTime !== null && (
                                        <div className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black animate-pulse">
                                            KPI GEN: {propTime} DÍAS
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className={labelClass}>F. Inicio</label>
                                    <input type="date" className={inputClass} value={formData.startDate || ''} onChange={e => handleChange('startDate', e.target.value)} required disabled={isReadOnly} />
                                </div>
                                <div>
                                    <label className={labelClass}>F. Entendim.</label>
                                    <input type="date" className={inputClass} value={formData.engagementDate || ''} onChange={e => handleChange('engagementDate', e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div>
                                    <label className={labelClass}>F. Alcance</label>
                                    <input type="date" className={inputClass} value={formData.scopeDate || ''} onChange={e => handleChange('scopeDate', e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div>
                                    <label className={labelClass}>F. COE</label>
                                    <input type="date" className={inputClass} value={formData.coeDate || ''} onChange={e => handleChange('coeDate', e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div className="pt-2 border-t border-gray-200 mt-2">
                                    <label className={`${labelClass} text-blue-600`}>F. Compromiso</label>
                                    <input type="date" className={`${inputClass} border-blue-200 bg-blue-50/30`} value={formData.deliveryDate || ''} onChange={e => handleChange('deliveryDate', e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div className="pt-2 border-t border-gray-200 mt-2">
                                    <label className={`${labelClass} text-green-600`}>F. Entrega Real</label>
                                    <input type="date" className={`${inputClass} border-green-200 bg-green-50/30`} value={formData.realDeliveryDate || ''} onChange={e => handleChange('realDeliveryDate', e.target.value)} disabled={isReadOnly} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dimensionamiento</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Horas Estimadas</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                                            <input type="number" className={`${inputClass} pl-9 font-bold`} placeholder="0" value={formData.hours || ''} onChange={e => handleChange('hours', parseInt(e.target.value))} disabled={isReadOnly} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Plazo (Meses)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                                            <input type="number" className={`${inputClass} pl-9 font-bold`} placeholder="0" value={formData.term || ''} onChange={e => handleChange('term', parseInt(e.target.value))} disabled={isReadOnly} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Enlace Plan de Trabajo</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                                        <input type="text" className={`${inputClass} pl-9 text-[10px]`} placeholder="https://sharepoint.com/..." value={formData.workPlanLink || ''} onChange={e => handleChange('workPlanLink', e.target.value)} disabled={isReadOnly} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* SECCIÓN OBSERVACIONES */}
                    <div className="pt-8 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-inner">
                            <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center uppercase tracking-widest">
                                <MessageSquare size={20} className="mr-3 text-blue-600"/> Historial de Observaciones
                            </h3>
                            
                            {!isReadOnly && (
                                <div className="flex gap-4 mb-8">
                                    <input 
                                        type="text" 
                                        className="flex-1 border-2 border-gray-200 rounded-2xl px-6 py-4 text-sm bg-white shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Nueva actualización de estado..."
                                        value={newObservationText}
                                        onChange={(e) => setNewObservationText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObservation())}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAddObservation}
                                        disabled={!newObservationText.trim()}
                                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center font-black shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase text-xs tracking-widest"
                                    >
                                        <Plus size={18} className="mr-2" /> Agregar
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                {(!formData.observationHistory || formData.observationHistory.length === 0) ? (
                                    <div className="py-12 text-center text-gray-300 font-bold uppercase tracking-widest italic opacity-50">
                                        No hay registros históricos
                                    </div>
                                ) : (
                                    formData.observationHistory.map((obs, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start group hover:border-blue-200 transition-all">
                                            <div className="flex-1 mr-6">
                                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] mb-2 flex items-center">
                                                    <Clock size={12} className="mr-2"/> {obs.date}
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                                    {obs.text}
                                                </p>
                                            </div>
                                            {!isReadOnly && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteObservation(idx)}
                                                    className="text-gray-200 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Acciones Finales */}
                    <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-10 py-4 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-100 rounded-2xl transition-all"
                        >
                            {isReadOnly ? "Cerrar" : "Cancelar"}
                        </button>
                        {!isReadOnly && (
                            <button 
                                type="submit"
                                className="px-14 py-4 bg-blue-600 text-white text-xs font-black rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-[0.2em]"
                            >
                                Guardar Cambios
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;
