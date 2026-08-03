import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin as MapPinIcon, Crosshair } from 'lucide-react';
import { State, City } from 'country-state-city';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position === null ? null : <Marker position={position}></Marker>;
}

function UpdateMapCenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);
    return null;
}

export default function SiteModal({ isOpen, isEditing, formData, projects, employees, isSaving, onClose, onSave, onInputChange }) {
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedStateCode, setSelectedStateCode] = useState('');
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center

    useEffect(() => {
        setStates(State.getStatesOfCountry('IN'));
    }, []);

    useEffect(() => {
        if (formData.state) {
            const foundState = State.getStatesOfCountry('IN').find(s => s.name === formData.state);
            if (foundState) {
                setSelectedStateCode(foundState.isoCode);
                setCities(City.getCitiesOfState('IN', foundState.isoCode));
            }
        } else {
            setSelectedStateCode('');
            setCities([]);
        }
    }, [formData.state, isOpen]);

    const handleStateChange = (e) => {
        const stateCode = e.target.value;
        const stateName = e.target.options[e.target.selectedIndex].text;
        setSelectedStateCode(stateCode);
        setCities(City.getCitiesOfState('IN', stateCode));
        onInputChange({ target: { name: 'state', value: stateName } });
        onInputChange({ target: { name: 'city', value: '' } });
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    onInputChange({ target: { name: 'latitude', value: latitude } });
                    onInputChange({ target: { name: 'longitude', value: longitude } });
                    setMapCenter([latitude, longitude]);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    alert("Could not get current location.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const position = formData.latitude && formData.longitude 
        ? { lat: Number(formData.latitude), lng: Number(formData.longitude) } 
        : null;

    useEffect(() => {
        if (position && isOpen) {
            setMapCenter([position.lat, position.lng]);
        }
    }, [position?.lat, position?.lng, isOpen]);

    const handleMapClick = (latlng) => {
        onInputChange({ target: { name: 'latitude', value: latlng.lat } });
        onInputChange({ target: { name: 'longitude', value: latlng.lng } });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[600px] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white shrink-0">
                    <div>
                        <h2 className="text-base font-semibold">{isEditing ? 'Edit Site' : 'Add New Site'}</h2>
                        <p className="text-xs text-white/60 mt-0.5">Site Registry</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSave} className="flex flex-col md:flex-row overflow-hidden flex-1">
                    {/* Form Fields */}
                    <div className="p-6 space-y-4 md:w-1/2 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Site Name</label>
                                <input name="name" value={formData.name || ''} onChange={onInputChange} required className="input" placeholder="e.g. site-01" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Project</label>
                                <select name="projectId" value={formData.projectId || ''} onChange={onInputChange} required className="input">
                                    <option value="" disabled>Select Project</option>
                                    {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Site Manager</label>
                                <select name="siteManagerId" value={formData.siteManagerId || ''} onChange={onInputChange} required className="input">
                                    <option value="" disabled>Select Manager</option>
                                    {employees?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Type</label>
                                <select name="type" value={formData.type || 'construction'} onChange={onInputChange} className="input">
                                    {['warehouse', 'construction', 'factory', 'office'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">State</label>
                                <select name="stateCode" value={selectedStateCode} onChange={handleStateChange} className="input">
                                    <option value="" disabled>Select State</option>
                                    {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">City</label>
                                <select name="city" value={formData.city || ''} onChange={onInputChange} className="input" disabled={!selectedStateCode}>
                                    <option value="" disabled>Select City</option>
                                    {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Status</label>
                                <select name="status" value={formData.status || 'planning'} onChange={onInputChange} className="input">
                                    {['planning', 'active', 'completed', 'on_hold', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            <button type="button" onClick={handleGetLocation} className="btn-secondary w-full flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                                <Crosshair className="w-4 h-4" /> Get My Current Location
                            </button>
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isSaving}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSaving}>
                                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (isEditing ? 'Update Site' : 'Add Site')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className="md:w-1/2 p-4 bg-slate-50 border-l border-slate-200 flex flex-col flex-1 relative z-0">
                        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-slate-400" /> Map Location (Click to set)
                        </label>
                        <div className="flex-1 rounded-xl overflow-hidden border border-slate-300 relative">
                            <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap contributors"
                                />
                                <UpdateMapCenter center={mapCenter} />
                                <LocationPicker position={position} setPosition={handleMapClick} />
                            </MapContainer>
                        </div>
                        <div className="flex gap-4 mt-3 shrink-0">
                            <div className="space-y-1 flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latitude</label>
                                <input type="number" step="0.00000001" name="latitude" value={formData.latitude || ''} onChange={onInputChange} className="input h-8 text-sm" placeholder="Lat" />
                            </div>
                            <div className="space-y-1 flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Longitude</label>
                                <input type="number" step="0.00000001" name="longitude" value={formData.longitude || ''} onChange={onInputChange} className="input h-8 text-sm" placeholder="Lng" />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
