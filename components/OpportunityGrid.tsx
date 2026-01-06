
import React, { useState } from 'react';
import { Opportunity, CellColor, Account, Employee, OpportunityStatus } from '../types';
import { calculateDaysDiff, validateColorVsPercentage, calculateProposalGenerationTime } from '../utils/businessLogic';
import { Edit2, Archive, Trash2, Save, X, FileText, Calendar, Link as LinkIcon, Clock, Sparkles, Layout, MousePointer2, RefreshCw } from 'lucide-react';

interface Props {
    data: Opportunity[];
    onUpdate: (opp: Opportunity) => void;
    onOpenDetail: (opp: Opportunity) => void;
    onArchive: (opp: Opportunity) => void;
    onUnarchive: (opp: Opportunity) => void;
    onRestore: (opp: Opportunity) => void;
    onDelete: (id: number) => void;
    isHistoryView?: boolean;
    isTrashView?: boolean;
    accounts: Account[];
    employees: Employee[];
    statuses: OpportunityStatus[];
}

const InlineDateInput = ({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) => {
    return (
        <div className="flex items-center justify-between gap-1 mb-1">
            <label className="text-[9px] font-black text-gray-400 w-16 truncate uppercase tracking-tighter">{label}:</label>
            <input 
                type="date" 
                className="flex-1 border border-gray-200 rounded px-1 py-0 text-[10px] bg-white outline-none focus:border-blue-400"
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
            />
        </div>
    );
};

const OpportunityGrid: React.FC<Props> = ({ 
    data, onUpdate, onOpenDetail, onArchive, onUnarchive, onRestore, onDelete, isHistoryView, isTrashView,
    accounts, employees, statuses
}) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Opportunity>>({});

    const handleEditClick = (row: Opportunity) => {
        setEditingId(row.id);
        setEditForm({ ...row });
    };

    const handleSaveEdit = () => {
        if (!editForm || !editingId) return;
        const color = editForm.color as CellColor;
        const pct = editForm.percentage !== undefined ? editForm.percentage : 0;
        const validation = validateColorVsPercentage(color, pct);
        if (!validation.isValid) {
            alert(validation.message);
            return;
        }
        onUpdate(editForm as Opportunity);
        setEditingId(null);
    };

    const getColorClass = (color: CellColor) => {
        switch (color) {
            case CellColor.RED: return 'bg-red-500 text-white';
            case CellColor.YELLOW: return 'bg-yellow-400 text-black';
            case CellColor.GREEN: return 'bg-green-500 text-white';
            default: return 'bg-white text-gray-900';
        }
    };

    const formatDate = (date?: string) => {
        if (!date) return '-';
        const [y, m, d] = date.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="overflow-x-auto border rounded-xl shadow-xl bg-white overflow-hidden">
            <table className="min-w-full text-xs text-left border-collapse table-fixed">
                <thead className="bg-[#f8fafc] text-gray-500 font-bold uppercase tracking-tight text-[10px] border-b">
                    <tr>
                        <th className="px-1 py-4 border-r w-12 text-center">#</th>
                        <th className="px-1 py-4 border-r w-16 text-center">%</th>
                        <th className="px-3 py-4 border-r w-44">Cuenta</th>
                        <th className="px-3 py-4 border-r w-64">Oportunidad</th>
                        <th className="px-3 py-4 border-r w-72 bg-gray-50/30">Observaciones</th>
                        <th className="px-2 py-4 border-r w-40 text-center bg-green-50/30">Estado</th>
                        <th className="px-3 py-4 border-r w-60 text-center bg-blue-50/30">Cronograma</th>
                        <th className="px-2 py-4 border-r w-24 text-center bg-blue-50/30">Días</th>
                        <th className="px-2 py-4 border-r w-32 text-center bg-yellow-50/30">Proyecto</th>
                        <th className="px-3 py-4 border-r w-52 text-center">Equipo</th>
                        <th className="px-2 py-4 w-24 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {data.map((row) => {
                        const isEditing = editingId === row.id;
                        const daysCoe = calculateDaysDiff(row.startDate, row.coeDate);
                        const daysEnt = calculateDaysDiff(row.startDate, row.realDeliveryDate || row.deliveryDate);
                        const proposalGenTime = calculateProposalGenerationTime(row.scopeDate, row.realDeliveryDate);
                        
                        return (
                            <tr key={row.id} className={`hover:bg-blue-50/10 align-top transition-colors ${isEditing ? 'bg-blue-50/30 shadow-inner' : ''}`}>
                                <td className="px-1 py-4 border-r text-center text-gray-400 font-medium align-middle">{row.id}</td>
                                
                                <td className={`px-1 py-4 border-r text-center align-middle font-black text-[13px] ${!isEditing ? getColorClass(row.color) : 'bg-white'}`}>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1 p-1">
                                            <input type="number" className="w-full border rounded text-center text-[10px] p-0.5" value={editForm.percentage} onChange={e => setEditForm(p => ({...p, percentage: parseInt(e.target.value)}))} />
                                            <select className="w-full border rounded text-[9px] p-0.5" value={editForm.color} onChange={e => setEditForm(p => ({...p, color: e.target.value as CellColor}))}>
                                                <option value={CellColor.NONE}>S/C</option>
                                                <option value={CellColor.RED}>Rojo</option>
                                                <option value={CellColor.YELLOW}>Am.</option>
                                                <option value={CellColor.GREEN}>Ve.</option>
                                            </select>
                                        </div>
                                    ) : (row.percentage + '%')}
                                </td>

                                <td className="px-3 py-4 border-r font-bold text-gray-900 align-middle">
                                    {isEditing ? (
                                        <select className="w-full border rounded text-[10px] p-1" value={editForm.account} onChange={e => setEditForm(p => ({...p, account: e.target.value}))}>
                                            <option value="">Seleccionar...</option>
                                            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                        </select>
                                    ) : row.account}
                                </td>

                                <td className="px-3 py-4 border-r text-gray-800 align-middle">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <input className="w-full border rounded p-1 text-[10px] font-bold" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
                                            <div className="flex gap-2">
                                                <label className="flex items-center text-[9px] gap-1 cursor-pointer font-bold text-purple-600 bg-purple-50 px-1 rounded border border-purple-100">
                                                    <input type="checkbox" checked={editForm.isAIProposal} onChange={e => setEditForm(p => ({...p, isAIProposal: e.target.checked}))}/> IA
                                                </label>
                                                <label className="flex items-center text-[9px] gap-1 cursor-pointer font-bold text-indigo-600 bg-indigo-50 px-1 rounded border border-indigo-100">
                                                    <input type="checkbox" checked={editForm.isPrototypeProposal} onChange={e => setEditForm(p => ({...p, isPrototypeProposal: e.target.checked}))}/> PROTO
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-bold text-[11px] leading-tight text-gray-900 uppercase">{row.name}</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {row.isAIProposal && (
                                                    <span className="bg-purple-100 text-purple-700 text-[8px] px-1.5 py-0.5 rounded-md flex items-center font-black border border-purple-200">
                                                        <Sparkles size={8} className="mr-0.5"/> IA
                                                    </span>
                                                )}
                                                {row.isPrototypeProposal && (
                                                    <span className="bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-md flex items-center font-black border border-indigo-200">
                                                        <Layout size={8} className="mr-0.5"/> PROTOTIPO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </td>

                                <td className="px-3 py-4 border-r bg-gray-50/10 text-gray-500 italic leading-snug align-middle text-[10px]">
                                    {isEditing ? (
                                        <textarea className="w-full border rounded p-1 text-[10px] h-20 bg-white outline-none" value={editForm.observations} onChange={e => setEditForm(p => ({...p, observations: e.target.value}))} />
                                    ) : (row.observations || '-')}
                                </td>

                                <td className="px-2 py-4 border-r text-center align-middle bg-green-50/10">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <select className="w-full border rounded text-[9px] p-0.5" value={editForm.state} onChange={e => setEditForm(p => ({...p, state: e.target.value}))}>
                                                {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                            <input placeholder="Motivo..." className="w-full border rounded p-0.5 text-[9px]" value={editForm.reason || ''} onChange={e => setEditForm(p => ({...p, reason: e.target.value}))} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="px-2 py-0.5 rounded-full border border-green-200 bg-white text-green-700 font-bold text-[9px] uppercase tracking-tighter shadow-sm">
                                                {row.state}
                                            </span>
                                            {row.reason && <span className="text-[9px] text-gray-400 italic mt-0.5 leading-tight">{row.reason}</span>}
                                        </div>
                                    )}
                                </td>

                                <td className="px-3 py-4 border-r bg-blue-50/10 text-[10px]">
                                    {isEditing ? (
                                        <div className="flex flex-col">
                                            <InlineDateInput label="Inicio" value={editForm.startDate} onChange={v => setEditForm(p => ({...p, startDate: v}))} />
                                            <InlineDateInput label="Entend." value={editForm.engagementDate} onChange={v => setEditForm(p => ({...p, engagementDate: v}))} />
                                            <InlineDateInput label="Alcance" value={editForm.scopeDate} onChange={v => setEditForm(p => ({...p, scopeDate: v}))} />
                                            <InlineDateInput label="COE" value={editForm.coeDate} onChange={v => setEditForm(p => ({...p, coeDate: v}))} />
                                            <InlineDateInput label="Compro." value={editForm.deliveryDate} onChange={v => setEditForm(p => ({...p, deliveryDate: v}))} />
                                            <InlineDateInput label="Real" value={editForm.realDeliveryDate} onChange={v => setEditForm(p => ({...p, realDeliveryDate: v}))} />
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5 text-gray-700 font-medium">
                                            <div className="flex justify-between gap-1 border-b border-blue-50"><span className="text-gray-400 font-black text-[8px] uppercase">Inicio:</span> <span>{formatDate(row.startDate)}</span></div>
                                            <div className="flex justify-between gap-1 border-b border-blue-50"><span className="text-gray-400 font-black text-[8px] uppercase">Entend:</span> <span>{formatDate(row.engagementDate)}</span></div>
                                            <div className="flex justify-between gap-1 border-b border-blue-50"><span className="text-gray-400 font-black text-[8px] uppercase">Alcance:</span> <span>{formatDate(row.scopeDate)}</span></div>
                                            <div className="flex justify-between gap-1 border-b border-blue-50"><span className="text-gray-400 font-black text-[8px] uppercase">COE:</span> <span>{formatDate(row.coeDate)}</span></div>
                                            <div className="flex justify-between gap-1 border-b border-blue-50 mt-1 pt-1"><span className="text-blue-500 font-black text-[8px] uppercase">Compromiso:</span> <span className="font-bold">{formatDate(row.deliveryDate)}</span></div>
                                            <div className="flex justify-between gap-1 bg-blue-50/50 rounded px-0.5"><span className="text-gray-600 font-black text-[8px] uppercase">Entrega Real:</span> <span className="font-bold">{formatDate(row.realDeliveryDate)}</span></div>
                                        </div>
                                    )}
                                </td>

                                <td className="px-2 py-4 border-r bg-blue-50/10 align-middle">
                                    <div className="flex flex-col gap-2 text-[10px] font-black text-gray-500">
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-1" title="Días desde Inicio hasta COE"><span className="text-gray-400 font-black text-[8px]">COE:</span> <span className="text-gray-900">{daysCoe !== null ? Math.round(daysCoe) : '-'}</span></div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-1" title="Días desde Inicio hasta Entrega (Real si existe)"><span className="text-gray-400 font-black text-[8px]">ENT:</span> <span className="text-gray-900">{daysEnt !== null ? Math.round(daysEnt) : '-'}</span></div>
                                        <div className="flex flex-col items-center bg-blue-50 p-1 rounded border border-blue-100 mt-1 shadow-sm" title="Tiempo de generación de propuestas (Alcance vs Entrega Real)">
                                            <span className="text-[7px] text-blue-400 uppercase leading-none mb-1 text-center font-bold">Tiempo Gen. Propuestas</span>
                                            <span className="text-[14px] text-blue-700 leading-none font-black">{proposalGenTime !== null ? Math.round(proposalGenTime) + ' d' : '-'}</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-2 py-4 border-r bg-yellow-50/10 align-middle">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <input type="number" className="w-full border rounded p-1 text-[9px]" placeholder="Hs" value={editForm.hours} onChange={e => setEditForm(p => ({...p, hours: parseInt(e.target.value)}))} />
                                            <input type="number" className="w-full border rounded p-1 text-[9px]" placeholder="Meses" value={editForm.term} onChange={e => setEditForm(p => ({...p, term: parseInt(e.target.value)}))} />
                                            <input className="w-full border rounded p-1 text-[8px]" placeholder="Link..." value={editForm.workPlanLink} onChange={e => setEditForm(p => ({...p, workPlanLink: e.target.value}))} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 items-center text-[10px] text-gray-600">
                                            <div className="flex items-center gap-1.5 font-bold"><Clock size={12} className="text-gray-400"/> {row.hours || '-'} hs</div>
                                            <div className="flex items-center gap-1.5 font-bold"><Calendar size={12} className="text-gray-400"/> {row.term || '-'} meses</div>
                                            {row.workPlanLink && <a href={row.workPlanLink} target="_blank" className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-black transition-all text-[9px]"><LinkIcon size={10}/> PLAN</a>}
                                        </div>
                                    )}
                                </td>

                                <td className="px-3 py-4 border-r align-middle text-[10px]">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-1">
                                            <select className="w-full border rounded p-0.5 text-[9px]" value={editForm.manager} onChange={e => setEditForm(p => ({...p, manager: e.target.value}))}>
                                                <option value="">Gte Comercial...</option>
                                                {employees.filter(e => e.role === 'Gerente Comercial').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>
                                            <select className="w-full border rounded p-0.5 text-[9px]" value={editForm.responsibleDC} onChange={e => setEditForm(p => ({...p, responsibleDC: e.target.value}))}>
                                                <option value="">DC...</option>
                                                {employees.filter(e => e.role === 'DC').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>
                                            <select className="w-full border rounded p-0.5 text-[9px]" value={editForm.responsibleBusiness} onChange={e => setEditForm(p => ({...p, responsibleBusiness: e.target.value}))}>
                                                <option value="">Negocio...</option>
                                                {employees.filter(e => e.role === 'Analista de Negocios').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>
                                            <select className="w-full border rounded p-0.5 text-[9px]" value={editForm.responsibleTech} onChange={e => setEditForm(p => ({...p, responsibleTech: e.target.value}))}>
                                                <option value="">Técnico...</option>
                                                {employees.filter(e => e.role === 'Responsable Técnico').map(e => <option key={e.id} value={e.fullName}>{e.fullName}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 font-bold">
                                            <div className="flex justify-between gap-1"><span className="text-gray-400 uppercase font-black text-[8px] w-6">Gte:</span> <span className="text-gray-700 truncate">{row.manager || '-'}</span></div>
                                            <div className="flex justify-between gap-1"><span className="text-gray-400 uppercase font-black text-[8px] w-6">DC:</span> <span className="text-gray-700 truncate">{row.responsibleDC || '-'}</span></div>
                                            <div className="flex justify-between gap-1"><span className="text-gray-400 uppercase font-black text-[8px] w-6">Neg:</span> <span className="text-gray-700 truncate">{row.responsibleBusiness || '-'}</span></div>
                                            <div className="flex justify-between gap-1"><span className="text-gray-400 uppercase font-black text-[8px] w-6">Tec:</span> <span className="text-gray-700 truncate">{row.responsibleTech || '-'}</span></div>
                                        </div>
                                    )}
                                </td>

                                <td className="px-2 py-4 align-middle">
                                    <div className="flex flex-col gap-2 items-center justify-center">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <button onClick={handleSaveEdit} className="p-2 bg-green-500 text-white rounded shadow-md hover:bg-green-600 transition-all" title="Guardar"><Save size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 text-gray-600 rounded shadow-sm hover:bg-gray-300 transition-all" title="Cancelar"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {isTrashView ? (
                                                    <>
                                                        <button onClick={() => onRestore(row)} className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors" title="Restaurar"><RefreshCw size={16}/></button>
                                                        <button onClick={() => onDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="Eliminar Definitivamente"><Trash2 size={16}/></button>
                                                    </>
                                                ) : isHistoryView ? (
                                                    <>
                                                        <button onClick={() => onOpenDetail(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded transition-colors" title="Detalle"><FileText size={16}/></button>
                                                        <button onClick={() => onUnarchive(row)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Desarchivar"><RefreshCw size={16}/></button>
                                                        <button onClick={() => onDelete(row.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors col-span-2" title="Eliminar"><Trash2 size={16}/></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEditClick(row)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded transition-colors" title="Editar"><Edit2 size={16}/></button>
                                                        <button onClick={() => onOpenDetail(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded transition-colors" title="Detalle"><FileText size={16}/></button>
                                                        <button onClick={() => onArchive(row)} className="p-1.5 text-orange-500 hover:bg-orange-100 rounded transition-colors" title="Archivar"><Archive size={16}/></button>
                                                        <button onClick={() => onDelete(row.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title="Eliminar"><Trash2 size={16}/></button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {data.length === 0 && (
                <div className="py-24 text-center flex flex-col items-center text-gray-300">
                    <MousePointer2 size={64} className="mb-4 opacity-5"/>
                    <p className="font-black text-xl uppercase tracking-widest opacity-10 italic">No se encontraron registros</p>
                </div>
            )}
        </div>
    );
};

export default OpportunityGrid;
