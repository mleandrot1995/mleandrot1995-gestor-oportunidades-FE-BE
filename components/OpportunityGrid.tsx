import React, { useState, useRef } from 'react';
import { Opportunity, CellColor, Account, Employee, OpportunityStatus } from '../types';
import { calculateDaysDiff, validateColorVsPercentage } from '../utils/businessLogic';
import { Edit2, Archive, Trash2, AlertTriangle, Save, X, FileText, Calendar, RotateCcw, Link as LinkIcon, ExternalLink, Clock } from 'lucide-react';

interface Props {
    data: Opportunity[];
    onUpdate: (opp: Opportunity) => void;
    onOpenDetail: (opp: Opportunity) => void;
    onArchive: (opp: Opportunity) => void;
    onUnarchive?: (opp: Opportunity) => void;
    onRestore?: (opp: Opportunity) => void; // From Trash to Active
    onDelete: (id: number) => void;
    isHistoryView?: boolean;
    isTrashView?: boolean;

    // Catalogs for Inline Editing Dropdowns
    accounts: Account[];
    employees: Employee[]; // Includes Managers now
    statuses: OpportunityStatus[];
}

// Helper Component for Inline Date Inputs with Clickable Icon inside the input
const InlineDateInput = ({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const openPicker = () => {
        const input = inputRef.current;
        if (input) {
            try {
                // Use typeof check to avoid strict type narrowing that might result in 'never'
                if (typeof (input as any).showPicker === 'function') {
                    (input as any).showPicker();
                } else {
                    input.focus();
                }
            } catch (e) {
                console.warn("Cannot open picker:", e);
                input.focus();
            }
        }
    };

    return (
        <div className="flex items-center justify-between gap-1">
            {/* Label - Click also focuses/opens picker */}
            <div 
                className="cursor-pointer hover:text-blue-600 transition-colors"
                onClick={openPicker}
                title={`Cambiar fecha de ${label}`}
            >
                <label className="text-[11px] font-bold w-16 cursor-pointer block truncate">{label}</label>
            </div>

            {/* Input Container with Icon Overlay */}
            <div className="relative flex-1">
                <input 
                    ref={inputRef}
                    type="date" 
                    className={`
                        w-full border rounded px-1 py-0.5 text-xs bg-white text-gray-900 cursor-pointer
                        pr-5 // Padding right to prevent text overlapping icon
                        [&::-webkit-calendar-picker-indicator]:opacity-0 // Hide default icon visually
                        [&::-webkit-calendar-picker-indicator]:absolute
                        [&::-webkit-calendar-picker-indicator]:right-0
                        [&::-webkit-calendar-picker-indicator]:top-0
                        [&::-webkit-calendar-picker-indicator]:h-full
                        [&::-webkit-calendar-picker-indicator]:w-6 // Width of the clickable area
                        [&::-webkit-calendar-picker-indicator]:cursor-pointer
                    `}
                    value={value || ''} 
                    onChange={e => onChange(e.target.value)} 
                />
                {/* Custom Icon positioned absolutely */}
                <Calendar 
                    size={14} 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                />
            </div>
        </div>
    );
};

const OpportunityGrid: React.FC<Props> = ({ 
    data, onUpdate, onOpenDetail, onArchive, onUnarchive, onRestore, onDelete, isHistoryView, isTrashView,
    accounts, employees, statuses
}) => {
    
    // Inline Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Opportunity>>({});

    const handleEditClick = (e: React.MouseEvent, row: Opportunity) => {
        e.stopPropagation();
        if (isHistoryView || isTrashView) return; // Prevent edit in history/trash
        setEditingId(row.id);
        setEditForm({ ...row }); // Create a copy to ensure detach from prop ref
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editForm || !editingId) return;
        
        // Validate Business Rules
        const color = editForm.color as CellColor;
        const pct = editForm.percentage !== undefined ? editForm.percentage : 0;
        
        const validation = validateColorVsPercentage(color, pct);
        if (!validation.isValid) {
            alert(`Error de Validación: ${validation.message}`);
            return;
        }

        // Validate Date ONLY if it changed
        const originalRow = data.find(r => r.id === editingId);
        if (!originalRow) return;

        if (editForm.deliveryDate) {
            // Only validate if the date is different from what it was
            if (editForm.deliveryDate !== originalRow.deliveryDate) {
                const today = new Date().toISOString().split('T')[0];
                if (editForm.deliveryDate < today) {
                    alert("Error: La fecha de Compromiso de Entrega no puede ser pasada.");
                    return;
                }
            }
        }

        // Prepare Payload
        const payload = { ...editForm, id: editingId } as Opportunity;

        // --- History Logic for Inline Edit ---
        // If the observation text changed in the grid, we add it to history automatically
        // so we don't lose the previous state, effectively "generating a new observation".
        if (editForm.observations !== originalRow.observations && editForm.observations) {
            const today = new Date().toISOString().split('T')[0];
            const newHistoryEntry = { date: today, text: editForm.observations };
            
            // Prepend to history (Newest first)
            const currentHistory = originalRow.observationHistory || [];
            payload.observationHistory = [newHistoryEntry, ...currentHistory];
        }

        onUpdate(payload);
        
        setEditingId(null);
        setEditForm({});
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.preventDefault(); // Safety
        e.stopPropagation();
        onDelete(id);
    };

    const handleArchiveClick = (e: React.MouseEvent, row: Opportunity) => {
        e.preventDefault(); // Safety
        e.stopPropagation();
        onArchive(row);
    };

    const handleUnarchiveClick = (e: React.MouseEvent, row: Opportunity) => {
        e.preventDefault();
        e.stopPropagation();
        if (onUnarchive) onUnarchive(row);
    };

    const handleRestoreClick = (e: React.MouseEvent, row: Opportunity) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRestore) onRestore(row);
    };

    const handleOpenDetailClick = (e: React.MouseEvent, row: Opportunity) => {
        e.stopPropagation();
        onOpenDetail(row);
    };

    const handleChange = (field: keyof Opportunity, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    // Helper for Read Mode Cell Background
    const getColorClass = (color: CellColor) => {
        switch (color) {
            case CellColor.RED: return 'bg-red-500 text-white';
            case CellColor.YELLOW: return 'bg-yellow-300 text-black';
            case CellColor.GREEN: return 'bg-green-500 text-white';
            default: return 'bg-white text-gray-900';
        }
    };

    // Helper for Edit Mode Select Background
    const getSelectColorClass = (color: CellColor | undefined) => {
        switch (color) {
            case CellColor.RED: return 'bg-red-600 text-white font-bold';
            case CellColor.YELLOW: return 'bg-yellow-300 text-black font-bold';
            case CellColor.GREEN: return 'bg-green-600 text-white font-bold';
            default: return 'bg-white text-gray-900 border-gray-300';
        }
    };

    const formatDateRow = (label: string, date?: string) => {
        if (!date) return null;
        
        // Convert YYYY-MM-DD to DD/MM/YYYY for display
        let displayDate = date;
        const parts = date.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            displayDate = `${day}/${month}/${year}`;
        }

        return (
            <div className="flex justify-between items-center text-[11px] leading-tight">
                <span className="font-semibold text-gray-500 w-20 truncate">{label}:</span>
                <span className="font-mono text-gray-800">{displayDate}</span>
            </div>
        );
    };

    const formatRoleRow = (label: string, value?: string) => {
        if (!value) return null;
        return (
            <div className="flex justify-between items-center text-[11px] leading-tight border-b border-dotted border-gray-200 last:border-0 pb-1">
                <span className="font-semibold text-gray-500 w-10">{label}:</span>
                <span className="text-gray-800 text-right truncate max-w-[160px]" title={value}>{value}</span>
            </div>
        );
    };

    return (
        <div className="overflow-x-auto border rounded-lg shadow-sm bg-white pb-20">
            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="text-gray-700 font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                        {/* Section 1: General Info */}
                        <th className="px-2 py-3 border border-gray-300 bg-gray-200 w-14 text-center">#</th>
                        <th className="px-2 py-3 border border-gray-300 bg-gray-200 w-28 text-center">%</th>
                        <th className="px-3 py-3 border border-gray-300 bg-gray-200 w-48 text-center">Cuenta</th>
                        <th className="px-3 py-3 border border-gray-300 bg-gray-200 w-72 text-center">Oportunidad</th>
                        
                        {/* Section 2: Observations, State & Reason */}
                        <th className="px-3 py-3 border border-gray-300 bg-gray-100 w-80 text-center">Observaciones</th>
                        <th className="px-2 py-3 border border-gray-300 bg-green-200 w-44 text-center">Estado</th>

                        {/* Section 3: Dates Consolidated */}
                        <th className="px-3 py-3 border border-gray-300 bg-blue-200 w-60 text-center">Cronograma (Fechas)</th>
                        
                        {/* Merged Days Column */}
                        <th className="px-2 py-3 border border-gray-300 bg-blue-200 w-24 text-center">Días</th>

                        {/* Section 4: Metrics & Plan (Combined) */}
                        <th className="px-2 py-3 border border-gray-300 bg-yellow-100 w-32 text-center">Plan proyecto</th>
                        
                        {/* Section 5: Team */}
                        <th className="px-3 py-3 border border-gray-300 bg-gray-200 w-48 text-center">Equipo Responsable</th>
                        
                        <th className="px-2 py-3 border border-gray-300 bg-gray-100 w-24 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((row) => {
                        const isEditing = editingId === row.id;
                        const daysCoe = calculateDaysDiff(row.startDate, row.coeDate);
                        const daysDel = calculateDaysDiff(row.startDate, row.deliveryDate);
                        
                        return (
                            <tr key={row.id} className={`hover:bg-gray-50 transition-colors align-top ${isEditing ? 'bg-yellow-50' : ''}`}>
                                
                                {/* ID - Static */}
                                <td className="px-2 py-3 border font-medium text-gray-500 text-center align-middle">{row.id}</td>

                                {/* Percentage & Color - Editable */}
                                <td className={`px-2 py-3 border text-center align-middle ${!isEditing ? getColorClass(row.color) : 'bg-white'}`}>
                                    {isEditing ? (
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    className="w-full border rounded px-1 py-1 text-center bg-white text-gray-900 font-bold text-sm"
                                                    value={editForm.percentage !== undefined ? editForm.percentage : ''}
                                                    onChange={e => handleChange('percentage', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                    placeholder="%"
                                                />
                                            </div>
                                            <select 
                                                className={`w-full border rounded px-1 py-1 text-xs ${getSelectColorClass(editForm.color as CellColor)}`}
                                                value={editForm.color}
                                                onChange={e => handleChange('color', e.target.value)}
                                            >
                                                <option value={CellColor.NONE} className="bg-white text-gray-900">Ninguno</option>
                                                <option value={CellColor.RED} className="bg-red-600 text-white font-bold">Rojo</option>
                                                <option value={CellColor.YELLOW} className="bg-yellow-300 text-black font-bold">Amarillo</option>
                                                <option value={CellColor.GREEN} className="bg-green-600 text-white font-bold">Verde</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <span className="font-bold text-base">{row.percentage}%</span>
                                    )}
                                </td>

                                {/* Account - Editable */}
                                <td className={`px-3 py-3 border align-middle ${(!isEditing && row.color === CellColor.RED) ? 'bg-red-500 text-white font-bold' : 'font-bold'}`}>
                                    {isEditing ? (
                                        <select 
                                            className="w-full border rounded px-1 py-1.5 bg-white text-gray-900 font-normal text-sm"
                                            value={editForm.account}
                                            onChange={e => handleChange('account', e.target.value)}
                                        >
                                            <option value="">Cuenta...</option>
                                            {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                        </select>
                                    ) : (
                                        <span className="text-sm">{row.account}</span>
                                    )}
                                </td>

                                {/* Name - Editable */}
                                <td className="px-3 py-3 border text-gray-800 align-middle">
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            className="w-full border rounded px-1 py-1.5 bg-white text-gray-900 text-sm"
                                            value={editForm.name || ''}
                                            onChange={e => handleChange('name', e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-sm">{row.name}</span>
                                    )}
                                </td>

                                {/* Observations - Editable */}
                                <td className="px-3 py-3 border bg-gray-50 align-middle">
                                     {isEditing ? (
                                        <textarea 
                                            className="w-full border rounded px-1 py-1 text-sm bg-white text-gray-900 h-28"
                                            value={editForm.observations || ''}
                                            onChange={e => handleChange('observations', e.target.value)}
                                            placeholder="Observaciones..."
                                        />
                                     ) : (
                                        <div className="text-xs text-gray-600 max-h-28 overflow-y-auto leading-relaxed" title={row.observations}>
                                            {row.observations || '-'}
                                        </div>
                                     )}
                                </td>

                                {/* State & Reason Combined - Editable */}
                                <td className="px-2 py-3 border bg-green-50 text-center align-middle">
                                    {isEditing ? (
                                        <div className="flex flex-col space-y-2">
                                            <select 
                                                className="w-full border rounded px-1 py-1.5 text-xs bg-white text-gray-900"
                                                value={editForm.state}
                                                onChange={e => handleChange('state', e.target.value)}
                                            >
                                                {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                            <input 
                                                type="text" 
                                                placeholder="Motivo..."
                                                className="w-full border rounded px-1 py-1 bg-white text-gray-900 text-xs"
                                                value={editForm.reason || ''}
                                                onChange={e => handleChange('reason', e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="px-3 py-1.5 rounded-full bg-white border border-green-200 text-green-800 text-[11px] uppercase font-bold shadow-sm inline-block mb-1.5">
                                                {row.state}
                                            </span>
                                            {row.reason && (
                                                <span className="text-[11px] text-gray-600 italic leading-tight">
                                                    {row.reason}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Dates - Editable */}
                                <td className="px-3 py-3 border bg-blue-50 align-middle">
                                    {isEditing ? (
                                        <div className="flex flex-col space-y-1.5 w-full">
                                            <InlineDateInput 
                                                label="Entend." 
                                                value={editForm.engagementDate} 
                                                onChange={(val) => handleChange('engagementDate', val)} 
                                            />
                                            <InlineDateInput 
                                                label="Alcance" 
                                                value={editForm.scopeDate} 
                                                onChange={(val) => handleChange('scopeDate', val)} 
                                            />
                                            <InlineDateInput 
                                                label="COE" 
                                                value={editForm.coeDate} 
                                                onChange={(val) => handleChange('coeDate', val)} 
                                            />
                                            <div className="border-t border-blue-200 pt-1.5 mt-1.5 space-y-1.5">
                                                <InlineDateInput 
                                                    label="Compromiso" 
                                                    value={editForm.deliveryDate} 
                                                    onChange={(val) => handleChange('deliveryDate', val)} 
                                                />
                                                <InlineDateInput 
                                                    label="Real" 
                                                    value={editForm.realDeliveryDate} 
                                                    onChange={(val) => handleChange('realDeliveryDate', val)} 
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col space-y-1.5">
                                            {formatDateRow("Inicio", row.startDate)}
                                            {formatDateRow("Entend.", row.engagementDate)}
                                            {formatDateRow("Alcance", row.scopeDate)}
                                            {formatDateRow("COE", row.coeDate)}
                                            <div className="border-t border-blue-200 my-1 pt-1.5 space-y-1">
                                                {formatDateRow("Compromiso", row.deliveryDate)}
                                                {formatDateRow("Real", row.realDeliveryDate)}
                                            </div>
                                        </div>
                                    )}
                                </td>
                                
                                {/* Days Calculations - Combined Column */}
                                <td className="px-2 py-3 border bg-blue-50 align-middle">
                                    <div className="flex flex-col space-y-2 text-[11px]">
                                        <div 
                                            className="flex justify-between items-center cursor-help border-b border-blue-200 border-dotted pb-1" 
                                            title="Días COE: Diferencia Fecha de Inicio y Fecha de aprobación del COE"
                                        >
                                            <span className="font-semibold text-gray-500 w-8">COE:</span>
                                            <span className="font-mono text-gray-800 text-sm">
                                                {daysCoe !== null ? Math.round(daysCoe) : '-'}
                                            </span>
                                        </div>
                                        <div 
                                            className="flex justify-between items-center cursor-help" 
                                            title="Días Ent: Diferencia Fecha de Inicio y Fecha de entrega al comercial"
                                        >
                                            <span className="font-semibold text-gray-500 w-8">Ent:</span>
                                            <span className="font-mono text-gray-800 text-sm">
                                                {daysDel !== null ? Math.round(daysDel) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Metrics & Plan - Combined Column (Hours, Term, Link) */}
                                <td className="px-2 py-3 border bg-yellow-50 align-middle">
                                    {isEditing ? (
                                        <div className="flex flex-col space-y-2">
                                            <input 
                                                type="number" 
                                                className="w-full border rounded px-1 py-1 text-center bg-white text-gray-900 text-xs"
                                                value={editForm.hours || ''}
                                                placeholder="Hs"
                                                onChange={e => handleChange('hours', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                title="Horas"
                                            />
                                            <input 
                                                type="number" 
                                                className="w-full border rounded px-1 py-1 text-center bg-white text-gray-900 text-xs"
                                                value={editForm.term || ''}
                                                placeholder="Meses"
                                                onChange={e => handleChange('term', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                title="Plazo"
                                            />
                                            <input 
                                                type="text" 
                                                className="w-full border rounded px-1 py-1 bg-white text-gray-900 text-xs"
                                                value={editForm.workPlanLink || ''}
                                                placeholder="Link..."
                                                onChange={e => handleChange('workPlanLink', e.target.value)}
                                                title="Link Plan de Trabajo"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col space-y-2 text-[11px] items-center">
                                            {/* Hours */}
                                            <div className="flex items-center space-x-1.5" title="Horas Estimadas">
                                                <Clock size={14} className="text-gray-500"/>
                                                <span className="text-gray-700 font-medium text-xs">{row.hours || '-'} hs</span>
                                            </div>
                                            {/* Term */}
                                            <div className="flex items-center space-x-1.5" title="Plazo Estimado (Meses)">
                                                <Calendar size={14} className="text-gray-500"/>
                                                <span className="text-gray-700 font-medium text-xs">{row.term || '-'} meses</span>
                                            </div>
                                            {/* Link */}
                                            {row.workPlanLink ? (
                                                <div className="pt-1" title={row.workPlanLink}>
                                                     {row.workPlanLink.startsWith('http') ? (
                                                         <a 
                                                            href={row.workPlanLink} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:border-blue-300 transition-colors"
                                                         >
                                                            <ExternalLink size={14} /> <span className="text-[10px]">Abrir Plan</span>
                                                         </a>
                                                     ) : (
                                                         <span className="text-[10px] text-gray-500 italic truncate max-w-[100px] block">{row.workPlanLink}</span>
                                                     )}
                                                </div>
                                            ) : (
                                                <div className="pt-1 opacity-20">
                                                    <LinkIcon size={14} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Responsables Stacked - Editable (Compact View) */}
                                <td className="px-3 py-3 border text-gray-700 align-middle">
                                    {isEditing ? (
                                        <div className="flex flex-col space-y-1">
                                            {/* Manager - FILTERED FROM EMPLOYEES */}
                                            <select 
                                                className="w-full border rounded px-1 py-0 text-xs h-7 bg-white text-gray-900"
                                                value={editForm.manager}
                                                onChange={e => handleChange('manager', e.target.value)}
                                                title="Gerente Comercial"
                                            >
                                                <option value="">Gerente...</option>
                                                {employees.filter(e => e.isActive && e.role === 'Gerente Comercial').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>

                                            {/* DC */}
                                            <select 
                                                className="w-full border rounded px-1 py-0 text-xs h-7 bg-white text-gray-900"
                                                value={editForm.responsibleDC}
                                                onChange={e => handleChange('responsibleDC', e.target.value)}
                                                title="Responsable DC"
                                            >
                                                <option value="">DC...</option>
                                                {employees.filter(e => e.isActive && e.role === 'DC').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>

                                            {/* Business */}
                                            <select 
                                                className="w-full border rounded px-1 py-0 text-xs h-7 bg-white text-gray-900"
                                                value={editForm.responsibleBusiness}
                                                onChange={e => handleChange('responsibleBusiness', e.target.value)}
                                                title="Responsable Negocio"
                                            >
                                                <option value="">Negocio...</option>
                                                {employees.filter(e => e.isActive && e.role === 'Analista de Negocios').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>

                                            {/* Tech */}
                                            <select 
                                                className="w-full border rounded px-1 py-0 text-xs h-7 bg-white text-gray-900"
                                                value={editForm.responsibleTech}
                                                onChange={e => handleChange('responsibleTech', e.target.value)}
                                                title="Responsable Técnico"
                                            >
                                                <option value="">Técnico...</option>
                                                {employees.filter(e => e.isActive && e.role === 'Responsable Técnico').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col space-y-1.5">
                                            {formatRoleRow("Gte", row.manager)}
                                            {formatRoleRow("DC", row.responsibleDC)}
                                            {formatRoleRow("Neg", row.responsibleBusiness)}
                                            {formatRoleRow("Tec", row.responsibleTech)}
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-2 py-3 border bg-gray-50 align-middle">
                                    <div className="grid grid-cols-2 gap-2 justify-items-center">
                                        {isEditing ? (
                                            <>
                                                <button 
                                                    type="button"
                                                    onClick={handleSaveEdit}
                                                    className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white shadow-sm"
                                                    title="Guardar Cambios"
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="p-1.5 bg-gray-300 hover:bg-gray-400 rounded text-gray-700 shadow-sm"
                                                    title="Cancelar Edición"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Edit Button - Hidden in History/Trash */}
                                                {!isHistoryView && !isTrashView && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleEditClick(e, row)}
                                                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                                                        title="Editar en Línea"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                
                                                {/* View Detail Button */}
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleOpenDetailClick(e, row)}
                                                    className="p-1.5 hover:bg-indigo-100 rounded text-indigo-600"
                                                    title={isHistoryView || isTrashView ? "Ver Detalle (Lectura)" : "Ver Detalle Completo"}
                                                >
                                                    <FileText size={18} />
                                                </button>

                                                {/* Archive Button - Active only */}
                                                {!isHistoryView && !isTrashView && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleArchiveClick(e, row)}
                                                        className="p-1.5 hover:bg-orange-100 rounded text-orange-600"
                                                        title="Mover a Históricos"
                                                    >
                                                        <Archive size={18} />
                                                    </button>
                                                )}

                                                {/* Unarchive Button - History only */}
                                                {isHistoryView && onUnarchive && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleUnarchiveClick(e, row)}
                                                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                                                        title="Restaurar a Activas"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}

                                                {/* Restore from Trash - Trash only */}
                                                {isTrashView && onRestore && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleRestoreClick(e, row)}
                                                        className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                                        title="Recuperar de Papelera"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}

                                                {/* Delete Button - All views (Logic differs) */}
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleDeleteClick(e, row.id)}
                                                    className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                                    title={isTrashView ? "Eliminar Definitivamente" : "Mover a Papelera"}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {data.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                    <AlertTriangle className="mx-auto mb-2" />
                    {isHistoryView ? "No hay oportunidades en el histórico." 
                     : isTrashView ? "La papelera de reciclaje está vacía."
                     : "No hay oportunidades activas."}
                </div>
            )}
        </div>
    );
};

export default OpportunityGrid;