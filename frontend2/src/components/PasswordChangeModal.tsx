
import React, { useState } from 'react';
import * as api from '../api';

interface Props {
    onPasswordChanged: () => void;
}

const PasswordChangeModal: React.FC<Props> = ({ onPasswordChanged }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        try {
            await api.changePassword(newPassword);
            setSuccess('Contraseña cambiada con éxito. Serás redirigido en 3 segundos.');
            setTimeout(() => {
                onPasswordChanged();
            }, 3000);
        } catch (err) {
            setError(err.message || 'Error al cambiar la contraseña');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
                <p className="mb-4 text-sm text-gray-600">Por ser tu primer inicio de sesión, es necesario que cambies tu contraseña.</p>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Cambiar Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordChangeModal;
