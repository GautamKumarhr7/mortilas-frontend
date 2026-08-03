import React from 'react';

/**
 * A reusable component to consistently display an employee's avatar, name, and designation.
 * 
 * @param {Object} props
 * @param {string|number} props.employeeId - The ID of the employee to look up.
 * @param {Array} props.employeesList - The list of all employees fetched from the backend.
 * @param {Object} [props.employee] - Optional. The raw employee object if already populated.
 * @param {boolean} [props.showDesignation=true] - Whether to show the designation below the name.
 */
export default function EmployeeAvatar({ employeeId, employeesList = [], employee, showDesignation = true }) {
    // Determine the employee object by looking it up in the list if not provided
    const emp = employee || employeesList.find(e => String(e.id) === String(employeeId)) || {};
    
    // Fallbacks for display
    const name = emp.name || emp.username || emp.userName || `Staff #${employeeId || emp.empId || 'Unknown'}`;
    const initial = name !== `Staff #${employeeId || emp.empId || 'Unknown'}` ? name.charAt(0).toUpperCase() : 'E';
    const designation = emp.designation || 'Staff';

    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                {initial}
            </div>
            <div>
                <p className="font-bold text-slate-800">{name}</p>
                {showDesignation && (
                    <p className="text-xs text-slate-500">{designation}</p>
                )}
            </div>
        </div>
    );
}
