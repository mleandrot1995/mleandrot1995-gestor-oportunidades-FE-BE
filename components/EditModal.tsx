import React, { useState, useEffect } from 'react';
import { Opportunity, CellColor, OpportunityState, Account, OpportunityStatus, DocumentType, OpportunityType, Employee, ObservationItem } from '../types';
import { validateColorVsPercentage } from '../utils/businessLogic';
import { AlertCircle, Lock, Calendar, Link as LinkIcon, Clock, HelpCircle, Plus, MessageSquare, Trash2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (opp: Opportunity) => void;
    initialData?: Opportunity;
    isReadOnly?: boolean;
    
    // Dynamic lists (Objects)
    accounts: Account[];
    teams: Employee[]; // Includes all employees now
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
            // New Opportunity Defaults
            setFormData({
                id: Math.floor(Math.random() * 10000), // Mock auto-increment
                startDate: new Date().toISOString().split('T')[0], // Today
                percentage: 0,
                color: CellColor.NONE,
                state: OpportunityState.EVALUACION,
                observationHistory: []
            });
        }
        setError(null);
        setNewObservationText('');
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field: keyof Opportunity, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Immediate Validation Feedback
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
        const newEntry: ObservationItem = {
            date: today,
            text: newObservationText.trim()
        };

        const updatedHistory = [newEntry, ...(formData.observationHistory || [])];

        setFormData(prev => ({
            ...prev,
            observationHistory: updatedHistory,
            observations: newObservationText.trim() // Update the latest text field
        }));
        
        setNewObservationText('');
    };

    const handleDeleteObservation = (index: number) => {
        if (isReadOnly) return;
        
        const currentHistory = [...(formData.observationHistory || [])];
        // Remove item at index
        currentHistory.splice(index, 1);

        setFormData(prev => ({
            ...prev,
            observationHistory: currentHistory,
            // If we deleted the first one (newest), update the main text field to the new newest or empty
            observations: index === 0 ? (currentHistory[0]?.text || '') : prev.observations
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final Strict Validation check
        const validation = validateColorVsPercentage(formData.color as CellColor, formData.percentage || 0);
        if(!validation.isValid) {
            setError(validation.message || "Error de validación");
            return;
        }

        if (formData.deliveryDate) {
            const today = new Date().toISOString().split('T')[0];
            
            // Allow if it matches initial data (legacy preservation)
            if (initialData && initialData.deliveryDate === formData.deliveryDate) {
                // Do nothing, allow legacy
            } else if (formData.deliveryDate < today) {
                 setError("Regla de Negocio: La Fecha de Compromiso no puede ser pasada.");
                 return;
            }
        }

        // If user typed in observation box but didn't click add, add it automatically
        if (newObservationText.trim()) {
             const today = new Date().toISOString().split('T')[0];
             const newEntry: ObservationItem = {
                date: today,
                text: newObservationText.trim()
             };
             const updatedHistory = [newEntry, ...(formData.observationHistory || [])];
             
             // Create a local copy to save
             const toSave = {
                 ...formData,
                 observationHistory: updatedHistory,
                 observations: newObservationText.trim()
             } as Opportunity;
             
             onSave(toSave);
        } else {
             onSave(formData as Opportunity);
        }

        onClose();
    };

    // Format date from YYYY-MM-DD to DD-MM-YYYY
    const formatHistoryDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    // Style for making the native calendar picker indicator transparent but covering the icon area
    const dateInputClass = `block w-full rounded border border-gray-300 p-2 text-sm pl-3 pr-10 
        ${isReadOnly ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'} 
        relative
        [&::-webkit-calendar-picker-indicator]:opacity-0
        [&::-webkit-calendar-picker-indicator]:absolute
        [&::-webkit-calendar-picker-indicator]:right-0
        [&::-webkit-calendar-picker-indicator]:top-0
        [&::-webkit-calendar-picker-indicator]:w-10
        [&::-webkit-calendar-picker-indicator]:h-full
        [&::-webkit-calendar-picker-indicator]:cursor-pointer
    `;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        {isReadOnly ? (
                            <>
                                <Lock className="mr-2 text-gray-500" size={20}/>
                                Detalle de Oportunidad (Lectura)
                            </>
                        ) : (
                             initialData ? `Editar Oportunidad #${initialData.id}` : 'Nueva Oportunidad'
                        )}
                    </h2>
                    {isReadOnly && <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">Solo Lectura</span>}
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                        <AlertCircle size={18} className="mr-2" />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Column 1: Core Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Información General</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-700">Cuenta</label>
                            <select 
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.account || ''}
                                onChange={e => handleChange('account', e.target.value)}
                                required
                                disabled={isReadOnly}
                            >
                                <option value="">Seleccionar...</option>
                                {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700">Oportunidad</label>
                            <input 
                                type="text"
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.name || ''}
                                onChange={e => handleChange('name', e.target.value)}
                                required
                                disabled={isReadOnly}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700">Gerente Comercial</label>
                            <select 
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.manager || ''}
                                onChange={e => handleChange('manager', e.target.value)}
                                required
                                disabled={isReadOnly}
                            >
                                <option value="">Seleccionar...</option>
                                {teams.filter(m => m.isActive && m.role === 'Gerente Comercial').map(m => <option key={m.id} value={m.fullName}>{m.fullName}</option>)}
                            </select>
                        </div>
                        
                        {/* New Role Based Selection */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                             <div>
                                <label className="block text-xs font-bold text-gray-700">Responsable DC</label>
                                <select 
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-xs bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.responsibleDC || ''}
                                    onChange={e => handleChange('responsibleDC', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="">Seleccionar...</option>
                                    {teams.filter(t => t.isActive && t.role === 'DC').map(t => <option key={t.id} value={t.fullName}>{t.fullName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700">Responsable Negocio</label>
                                <select 
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-xs bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.responsibleBusiness || ''}
                                    onChange={e => handleChange('responsibleBusiness', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="">Seleccionar...</option>
                                    {teams.filter(t => t.isActive && t.role === 'Analista de Negocios').map(t => <option key={t.id} value={t.fullName}>{t.fullName}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-700">Responsable Técnico</label>
                                <select 
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-xs bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.responsibleTech || ''}
                                    onChange={e => handleChange('responsibleTech', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="">Seleccionar...</option>
                                    {teams.filter(t => t.isActive && t.role === 'Responsable Técnico').map(t => <option key={t.id} value={t.fullName}>{t.fullName}</option>)}
                                </select>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div>
                                <label className="block text-xs font-bold text-gray-700">Tipo de Documento</label>
                                <select 
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-xs bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.documentType || ''}
                                    onChange={e => handleChange('documentType', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="">...</option>
                                    {docTypes.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700">Tipo Oportunidad (ON)</label>
                                <select 
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-xs bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.opportunityType || ''}
                                    onChange={e => handleChange('opportunityType', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="">...</option>
                                    {oppTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Status & Rules */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado y Semáforo</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-700">Porcentaje (%)</label>
                                <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.percentage}
                                    onChange={e => handleChange('percentage', parseInt(e.target.value))}
                                    required
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700">Color</label>
                                <select 
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.color || CellColor.NONE}
                                    onChange={e => handleChange('color', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value={CellColor.NONE} className="bg-white text-gray-900">Ninguno (0-49%)</option>
                                    <option value={CellColor.RED} className="bg-red-600 text-white font-bold">Rojo (0%)</option>
                                    <option value={CellColor.YELLOW} className="bg-yellow-300 text-black font-bold">Amarillo (50-69%)</option>
                                    <option value={CellColor.GREEN} className="bg-green-600 text-white font-bold">Verde (70-100%)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700">Estado</label>
                            <select 
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.state || ''}
                                onChange={e => handleChange('state', e.target.value)}
                                required
                                disabled={isReadOnly}
                            >
                                {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700">Motivo (si aplica)</label>
                            <input 
                                type="text"
                                placeholder="Ej. Costos, Alcance..."
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.reason || ''}
                                onChange={e => handleChange('reason', e.target.value)}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700">K-Rojo (Prioridad)</label>
                            <input 
                                type="number"
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.kRedIndex || 0}
                                onChange={e => handleChange('kRedIndex', parseInt(e.target.value))}
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* New Metrics Section */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                             <div>
                                <label className="block text-xs font-bold text-gray-700 flex items-center">
                                    <Clock size={12} className="mr-1"/> Horas Estimadas
                                </label>
                                <input 
                                    type="number"
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.hours || ''}
                                    placeholder="e.g. 100"
                                    onChange={e => handleChange('hours', e.target.value ? parseInt(e.target.value) : undefined)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 flex items-center">
                                     <Calendar size={12} className="mr-1"/> Plazo (Meses)
                                </label>
                                <input 
                                    type="number"
                                    className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.term || ''}
                                    placeholder="e.g. 6"
                                    onChange={e => handleChange('term', e.target.value ? parseInt(e.target.value) : undefined)}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Dates & History */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wider flex items-center">
                            Planificación (Fechas) 
                            <Calendar size={14} className="ml-1"/>
                        </h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-700 flex items-center cursor-help" title="Comercial pasa a preventa">
                                Fecha Inicio
                                <HelpCircle size={12} className="ml-1 text-gray-400"/>
                            </label>
                            <div className="relative mt-1">
                                <input 
                                    type="date"
                                    className={dateInputClass}
                                    value={formData.startDate || ''}
                                    onChange={e => handleChange('startDate', e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <Calendar 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                                    size={18} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-xs font-bold text-gray-700 flex items-center cursor-help" title="Primer reunión con Preventa">
                                    F. Entendimiento
                                    <HelpCircle size={12} className="ml-1 text-gray-400"/>
                                </label>
                                <div className="relative mt-1">
                                    <input 
                                        type="date"
                                        className={dateInputClass}
                                        value={formData.engagementDate || ''}
                                        onChange={e => handleChange('engagementDate', e.target.value)}
                                        disabled={isReadOnly}
                                    />
                                    <Calendar 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                                        size={18} 
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-700 flex items-center cursor-help" title="Cierre del alcance">
                                    F. Alcance
                                    <HelpCircle size={12} className="ml-1 text-gray-400"/>
                                </label>
                                <div className="relative mt-1">
                                    <input 
                                        type="date"
                                        className={dateInputClass}
                                        value={formData.scopeDate || ''}
                                        onChange={e => handleChange('scopeDate', e.target.value)}
                                        disabled={isReadOnly}
                                    />
                                    <Calendar 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                                        size={18} 
                                    />
                                </div>
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-gray-700 flex items-center cursor-help" title="Aprobacion Coe">
                                Fecha COE
                                <HelpCircle size={12} className="ml-1 text-gray-400"/>
                            </label>
                            <div className="relative mt-1">
                                <input 
                                    type="date"
                                    className={dateInputClass}
                                    value={formData.coeDate || ''}
                                    onChange={e => handleChange('coeDate', e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <Calendar 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                                    size={18} 
                                />
                            </div>
                        </div>
                        
                         <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                            <label className="block text-xs font-bold text-gray-800 flex items-center cursor-help" title="Fecha comprometida de entrega">
                                F. Compromiso Entrega (al Gte)
                                <HelpCircle size={12} className="ml-1 text-gray-500"/>
                            </label>
                            <div className="relative mt-1">
                                <input 
                                    type="date"
                                    className={dateInputClass}
                                    value={formData.deliveryDate || ''}
                                    onChange={e => handleChange('deliveryDate', e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <Calendar 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                                    size={18} 
                                />
                            </div>
                            {!isReadOnly && <span className="text-[10px] text-gray-500">* Futuro</span>}
                        </div>

                         <div className="bg-green-50 p-2 rounded border border-green-200">
                            <label className="block text-xs font-bold text-gray-800 flex items-center cursor-help" title="Fecha envío PP al comercial">
                                F. Entrega Real
                                <HelpCircle size={12} className="ml-1 text-gray-500"/>
                            </label>
                            <div className="relative mt-1">
                                <input 
                                    type="date"
                                    className={dateInputClass}
                                    value={formData.realDeliveryDate || ''}
                                    onChange={e => handleChange('realDeliveryDate', e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <Calendar 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                                    size={18} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Full Width Fields */}
                    <div className="md:col-span-3 space-y-3">
                        {/* New Work Plan Link */}
                         <div>
                            <label className="block text-xs font-bold text-gray-700 flex items-center">
                                <LinkIcon size={12} className="mr-1"/> Enlace a Plan de Trabajo
                            </label>
                            <input 
                                type="text"
                                className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={formData.workPlanLink || ''}
                                placeholder="Pegar enlace aquí (SharePoint, Drive, etc.) o texto descriptivo"
                                onChange={e => handleChange('workPlanLink', e.target.value)}
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Observations History Section */}
                        <div className="border rounded-lg p-3 bg-gray-50">
                            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <MessageSquare size={16} className="mr-2"/>
                                Historial de Observaciones
                            </h3>
                            
                            {!isReadOnly && (
                                <div className="mb-3">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 border rounded p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Nueva observación..."
                                            value={newObservationText}
                                            onChange={(e) => setNewObservationText(e.target.value)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleAddObservation}
                                            disabled={!newObservationText.trim()}
                                            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">* Se guardará con la fecha de hoy automáticamente.</p>
                                </div>
                            )}

                            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {(!formData.observationHistory || formData.observationHistory.length === 0) ? (
                                    <div className="text-center py-4 text-gray-400 text-sm italic">
                                        No hay historial registrado.
                                    </div>
                                ) : (
                                    formData.observationHistory.map((obs, idx) => (
                                        <div key={idx} className="bg-white p-2 rounded border border-gray-200 shadow-sm flex justify-between items-start group">
                                            <div className="flex-1 mr-2">
                                                <div className="text-[10px] font-bold text-blue-600 mb-0.5">
                                                    {formatHistoryDate(obs.date)}
                                                </div>
                                                <div className="text-xs text-gray-800">
                                                    {obs.text}
                                                </div>
                                            </div>
                                            {!isReadOnly && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteObservation(idx)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    title="Eliminar observación"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="md:col-span-3 flex justify-end space-x-3 pt-4 border-t">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                            {isReadOnly ? "Cerrar" : "Cancelar"}
                        </button>
                        {!isReadOnly && (
                            <button 
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
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