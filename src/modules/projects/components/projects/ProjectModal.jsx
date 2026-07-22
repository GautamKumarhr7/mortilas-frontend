import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { clientAPI } from '../../services';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    setPosition(marker.getLatLng());
                },
            }}
        />
    );
}

export default function ProjectModal({ isOpen, isEditing, formData, onClose, onSave, onInputChange, isLoading }) {
    const [clients, setClients] = useState([]);
    const [showQuickClient, setShowQuickClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '', gstinno: '', panno: '', address: '' });
    const [isSavingClient, setIsSavingClient] = useState(false);
    
    // Default to empty array if no documents
    const [docs, setDocs] = useState(formData?.documents || []);

    useEffect(() => {
        if (isOpen) {
            setDocs(formData?.documents || []);
            fetchClients();
        }
    }, [isOpen, formData]);

    const fetchClients = async () => {
        try {
            const res = await clientAPI.getAllClients();
            setClients(res?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClientDropdown = (e) => {
        if (e.target.value === 'create_new') {
            setShowQuickClient(true);
        } else {
            onInputChange(e);
        }
    };

    const handleQuickCreateClient = async () => {
        // Validate formats
        const phoneRegex = /^[0-9]{10}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z]{1}[0-9A-Z]{1}$/;

        if (!newClientData.name.trim() || !newClientData.email.trim() || !newClientData.phone.trim()) {
            alert('Name, Email and Phone are required.');
            return;
        }
        if (!phoneRegex.test(newClientData.phone)) {
            alert('Phone must be 10 digits.');
            return;
        }
        if (newClientData.panno && !panRegex.test(newClientData.panno)) {
            alert('Invalid PAN format. Example: ABCDE1234F');
            return;
        }
        if (newClientData.gstinno && !gstinRegex.test(newClientData.gstinno)) {
            alert('Invalid GSTIN format. Example: 07ABCDE1234F1Z5');
            return;
        }

        setIsSavingClient(true);
        try {
            const res = await clientAPI.createClient(newClientData);
            const created = res?.data || res;
            setClients([...clients, created]);
            // Automatically select the newly created client
            onInputChange({ target: { name: 'clientId', value: created.id } });
            setShowQuickClient(false);
            setNewClientData({ name: '', email: '', phone: '', gstinno: '', panno: '', address: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingClient(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                onInputChange({ target: { name: 'latitude', value: position.coords.latitude } });
                onInputChange({ target: { name: 'longitude', value: position.coords.longitude } });
            });
        }
    };

    if (!isOpen) return null;

    const mapCenter = (formData?.latitude && formData?.longitude) 
        ? [formData.latitude, formData.longitude] 
        : [28.6139, 77.2090]; // Default New Delhi

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white shrink-0">
                    <div>
                        <h2 className="text-base font-semibold">{isEditing ? 'Edit Project Details' : 'Enroll New Project'}</h2>
                        <p className="text-xs text-white/60 mt-0.5">Project Master / DB API Tracker</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Form */}
                    <form onSubmit={(e) => {
                        // Inject documents into formData directly before passing to onSave
                        formData.documents = docs;
                        onSave(e);
                    }} className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
                        <div>
                            <h3 className="text-sm font-semibold text-[#1e3a34] border-b pb-2">1. Project Identity</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Category <span className="text-red-500">*</span></label>
                                    <select required name="category" value={formData.category || 'Civil'} onChange={onInputChange} className="input">
                                        {['Civil', 'Electrical', 'HVAC', 'Solar', 'Interior', 'Security', 'Composite'].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-xs font-semibold text-slate-600">Project Code <span className="text-slate-400 font-normal">(Leave sequence blank to auto-generate)</span></label>
                                    <div className="flex items-center">
                                        <span className="px-3 py-2 text-xs font-mono bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500">
                                            {`MECPL-${
                                                {
                                                    'Civil': 'CIV',
                                                    'Electrical': 'ELEC',
                                                    'HVAC': 'HVAC',
                                                    'Solar': 'SOLR',
                                                    'Interior': 'INT',
                                                    'Security': 'SEC',
                                                    'Composite': 'COMP'
                                                }[formData.category || 'Civil'] || 'CIV'
                                            }-`}
                                        </span>
                                        <input 
                                            disabled={isEditing} 
                                            name="projectCodeYear" 
                                            value={formData.projectCodeYear || new Date().getFullYear().toString()} 
                                            onChange={(e) => {
                                                if (/^\d{0,4}$/.test(e.target.value)) onInputChange(e);
                                            }} 
                                            className="input rounded-none border-x-0 border-slate-200 w-16 text-center px-1" 
                                            placeholder="Year" 
                                            maxLength={4}
                                        />
                                        <span className="px-1 py-2 text-xs font-mono bg-slate-100 border-y border-slate-200 text-slate-500">
                                            -
                                        </span>
                                        <input 
                                            disabled={isEditing} 
                                            name="projectCodeSequence" 
                                            value={formData.projectCodeSequence || ''} 
                                            onChange={(e) => {
                                                if (/^\d*$/.test(e.target.value)) onInputChange(e);
                                            }} 
                                            className="input rounded-l-none border-l-0 disabled:opacity-50" 
                                            placeholder="e.g. 001" 
                                            maxLength={3}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-xs font-semibold text-slate-600">Project Full Name <span className="text-red-500">*</span></label>
                                    <input required name="name" value={formData.name || ''} onChange={onInputChange} className="input" placeholder="e.g. New Airport Terminal" />
                                </div>
                                
                                {/* Client Dropdown with Quick Create */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Client Authority <span className="text-red-500">*</span></label>
                                    {!showQuickClient ? (
                                        <select required name="clientId" value={formData.clientId || ''} onChange={handleClientDropdown} className="input">
                                            <option value="" disabled>Select a client...</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                            <option value="create_new" className="font-semibold text-emerald-600">+ Create New Client</option>
                                        </select>
                                    ) : (
                                        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" className="input" placeholder="Client Name *" value={newClientData.name} onChange={(e) => setNewClientData({...newClientData, name: e.target.value})} />
                                                <input type="email" className="input" placeholder="Email *" value={newClientData.email} onChange={(e) => setNewClientData({...newClientData, email: e.target.value})} />
                                                <input type="text" className="input" placeholder="Phone (10 digits) *" value={newClientData.phone} onChange={(e) => {
                                                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) {
                                                        setNewClientData({...newClientData, phone: e.target.value});
                                                    }
                                                }} />
                                                <input type="text" className="input uppercase" placeholder="GSTIN No" value={newClientData.gstinno} onChange={(e) => setNewClientData({...newClientData, gstinno: e.target.value.toUpperCase()})} maxLength={15} />
                                                <input type="text" className="input uppercase" placeholder="PAN No" value={newClientData.panno} onChange={(e) => setNewClientData({...newClientData, panno: e.target.value.toUpperCase()})} maxLength={10} />
                                                <input type="text" className="input" placeholder="Address" value={newClientData.address} onChange={(e) => setNewClientData({...newClientData, address: e.target.value})} />
                                            </div>
                                            <div className="flex gap-2 justify-end mt-2">
                                                <button type="button" onClick={() => setShowQuickClient(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                                                <button type="button" onClick={handleQuickCreateClient} disabled={isSavingClient} className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">Save Client</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Site Address <span className="text-red-500">*</span></label>
                                    <input required name="siteAddress" value={formData.siteAddress || ''} onChange={onInputChange} className="input" placeholder="e.g. 123 Industrial Area, New Delhi" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-[#1e3a34] border-b pb-2 mt-6">2. Planning & Financials</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Contract Value (₹) <span className="text-red-500">*</span></label>
                                    <input required type="number" step="any" name="contractValue" value={formData.contractValue || ''} onChange={onInputChange} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Advance Payment (₹)</label>
                                    <input type="number" step="any" name="advancePayment" value={formData.advancePayment || ''} onChange={onInputChange} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Retention Percentage (%)</label>
                                    <input type="number" step="any" name="retentionPercentage" value={formData.retentionPercentage || ''} onChange={onInputChange} className="input" placeholder="e.g. 5" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Payment Terms</label>
                                    <input type="text" name="paymentTerms" value={formData.paymentTerms || ''} onChange={onInputChange} className="input" placeholder="e.g. 10% Advance, 90% Milestones" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Planned Start Date</label>
                                    <input type="date" name="plannedStart" value={formData.plannedStart || ''} onChange={onInputChange} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Planned End Date</label>
                                    <input type="date" name="plannedEnd" value={formData.plannedEnd || ''} onChange={onInputChange} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Actual Start Date</label>
                                    <input type="date" name="actualStart" value={formData.actualStart || ''} onChange={onInputChange} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Actual End Date</label>
                                    <input type="date" name="actualEnd" value={formData.actualEnd || ''} onChange={onInputChange} className="input" />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Revised End Date</label>
                                    <input type="date" name="revisedEnd" value={formData.revisedEnd || ''} onChange={onInputChange} className="input" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-[#1e3a34] border-b pb-2 mt-6">3. Document Repository</h3>
                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-slate-600">Attached Documents (Links/URLs)</label>
                                        <button 
                                            type="button" 
                                            onClick={() => setDocs([...docs, { type: 'Contract', name: '', url: '' }])}
                                            className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100"
                                        >
                                            + Add Document
                                        </button>
                                    </div>
                                    {docs.map((doc, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                                            <select 
                                                className="input py-1.5 px-2 text-xs w-[120px]" 
                                                value={doc.type} 
                                                onChange={(e) => {
                                                    const newDocs = [...docs];
                                                    newDocs[idx].type = e.target.value;
                                                    setDocs(newDocs);
                                                }}
                                            >
                                                <option value="Contract">Contract</option>
                                                <option value="Drawing">Drawing</option>
                                                <option value="Approval">Approval</option>
                                                <option value="Permit">Permit</option>
                                                <option value="Correspondence">Correspondence</option>
                                            </select>
                                            <input 
                                                className="input py-1.5 px-2 text-xs flex-1" 
                                                placeholder="Document Title" 
                                                value={doc.name}
                                                onChange={(e) => {
                                                    const newDocs = [...docs];
                                                    newDocs[idx].name = e.target.value;
                                                    setDocs(newDocs);
                                                }}
                                            />
                                            <input 
                                                className="input py-1.5 px-2 text-xs flex-1" 
                                                placeholder="URL / Link" 
                                                value={doc.url}
                                                onChange={(e) => {
                                                    const newDocs = [...docs];
                                                    newDocs[idx].url = e.target.value;
                                                    setDocs(newDocs);
                                                }}
                                            />
                                            <button type="button" onClick={() => setDocs(docs.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {docs.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No documents attached.</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-[#1e3a34] border-b pb-2 mt-6">4. Operational Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Process Action</label>
                                    <select name="process" value={formData.process || 'RUNNING'} onChange={onInputChange} className="input">
                                        <option value="RUNNING">RUNNING</option>
                                        <option value="HALTED">HALTED</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Current Status</label>
                                    <select name="status" value={formData.status || 'Draft'} onChange={onInputChange} className="input">
                                        {['Draft', 'Active', 'On Hold', 'Completed', 'Closed'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Notes / Remarks</label>
                                    <textarea name="notes" value={formData.notes || ''} onChange={onInputChange} className="input min-h-[60px]" placeholder="Additional details..." />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-auto pb-2">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                            <button type="submit" disabled={isLoading} className="btn-primary flex-1 disabled:opacity-50">
                                {isLoading ? 'Processing...' : (isEditing ? 'Update Project' : 'Create Project')}
                            </button>
                        </div>
                    </form>

                    {/* Right Panel: Map */}
                    <div className="w-[450px] lg:w-[500px] border-l border-slate-200 bg-slate-50 flex flex-col relative shrink-0">
                        <div className="absolute top-4 right-4 z-[500] flex gap-2">
                            <button 
                                type="button" 
                                onClick={handleUseCurrentLocation}
                                className="bg-white px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1.5"
                            >
                                <MapPin className="w-3.5 h-3.5" /> Use My Location
                            </button>
                        </div>
                        
                        <div className="h-[250px] md:h-full w-full relative bg-slate-200">
                            <MapContainer 
                                center={mapCenter} 
                                zoom={13} 
                                style={{ height: '100%', width: '100%' }}
                                key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when location updates
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <LocationMarker 
                                    position={formData?.latitude && formData?.longitude ? {lat: formData.latitude, lng: formData.longitude} : null} 
                                    setPosition={(pos) => {
                                        onInputChange({ target: { name: 'latitude', value: pos.lat } });
                                        onInputChange({ target: { name: 'longitude', value: pos.lng } });
                                    }} 
                                />
                            </MapContainer>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4 z-[500]">
                            <h4 className="text-xs font-black uppercase text-slate-800 mb-2 tracking-wider">GPS Coordinates</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                                    <input type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={onInputChange} className="input text-xs" placeholder="e.g. 28.6139" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                                    <input type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={onInputChange} className="input text-xs" placeholder="e.g. 77.2090" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
