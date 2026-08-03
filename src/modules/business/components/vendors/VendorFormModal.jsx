import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Save, UserCheck, Edit3, Eye, EyeOff } from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { vendorAPI } from '../../services';

export default function VendorFormModal({ isOpen, isEditing, initialData, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    companyName: '',
    vendorType: 'Material',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gstNo: '',
    panNo: '',
    msmeNo: '',
    isoNo: '',
    electricalLicense: '',
    epfNo: '',
    esiNo: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    status: 'Active',
    isPreferred: false,
    rating: 0,
    creditLimit: 0,
    password: '',
  });

  useEffect(() => {
    if (isOpen && isEditing && initialData) {
      setFormData({
        ...initialData,
        isPreferred: initialData.isPreferred || false,
        status: initialData.status || 'Active',
      });
    } else if (isOpen) {
      setFormData({
        companyName: '',
        vendorType: 'Material',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        gstNo: '',
        panNo: '',
        msmeNo: '',
        isoNo: '',
        electricalLicense: '',
        epfNo: '',
        esiNo: '',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifscCode: '',
        status: 'Active',
        isPreferred: false,
        rating: 0,
        creditLimit: 0,
        password: '',
      });
    }
  }, [isOpen, isEditing, initialData]);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const country = countries.find(c => c.name === formData.country);
    if (country) {
      setStates(State.getStatesOfCountry(country.isoCode));
    } else {
      setStates([]);
    }
  }, [formData.country, countries]);

  useEffect(() => {
    const country = countries.find(c => c.name === formData.country);
    const state = states.find(s => s.name === formData.state);
    if (country && state) {
      setCities(City.getCitiesOfState(country.isoCode, state.isoCode));
    } else {
      setCities([]);
    }
  }, [formData.state, states, formData.country, countries]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'country') {
        updated.state = '';
        updated.city = '';
      }
      if (name === 'state') {
        updated.city = '';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {isEditing ? <Edit3 className="w-5 h-5 text-blue-600" /> : <UserCheck className="w-5 h-5 text-[#2f6645]" />}
            {isEditing ? 'Update Vendor Details' : 'Vendor Onboarding'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Company Name <span className="text-red-500">*</span></label>
                <input required name="companyName" className="input w-full" value={formData.companyName} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Vendor Type <span className="text-red-500">*</span></label>
                <select required name="vendorType" className="input w-full bg-white" value={formData.vendorType} onChange={handleChange}>
                  <option value="Material">Material</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Service">Service</option>
                  <option value="Rental">Rental</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Contact Person <span className="text-red-500">*</span></label>
                <input required name="contactPerson" className="input w-full" value={formData.contactPerson} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email <span className="text-red-500">*</span></label>
                <input required type="email" name="email" className="input w-full" value={formData.email} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Phone <span className="text-red-500">*</span></label>
                <input required type="tel" name="phone" pattern="[0-9]{10}" title="Please enter a valid 10-digit phone number" className="input w-full" value={formData.phone} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Location & Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-semibold text-slate-700">Complete Address <span className="text-red-500">*</span></label>
                <input required name="address" className="input w-full" value={formData.address} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Country <span className="text-red-500">*</span></label>
                <select required name="country" className="input w-full bg-white" value={formData.country} onChange={handleChange}>
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c.isoCode} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">State <span className="text-red-500">*</span></label>
                <select required name="state" className="input w-full bg-white" value={formData.state} onChange={handleChange} disabled={!formData.country}>
                  <option value="">Select State</option>
                  {states.map(s => (
                    <option key={s.isoCode} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">City <span className="text-red-500">*</span></label>
                <select required name="city" className="input w-full bg-white" value={formData.city} onChange={handleChange} disabled={!formData.state}>
                  <option value="">Select City</option>
                  {cities.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Pincode <span className="text-red-500">*</span></label>
                <input required name="pincode" pattern="[0-9]{6}" title="Please enter a valid 6-digit pincode" className="input w-full" value={formData.pincode} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* Due Diligence */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Statutory & Due Diligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">GST Number <span className="text-red-500">*</span></label>
                <input required name="gstNo" pattern="^[0-9]{2}[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9A-Za-z]{1}[Zz]{1}[0-9a-zA-Z]{1}$" title="Please enter a valid 15-character GSTIN (e.g., 22AAAAA0000A1Z5)" className="input w-full font-mono uppercase" value={formData.gstNo} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">PAN Number <span className="text-red-500">*</span></label>
                <input required name="panNo" pattern="^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$" title="Please enter a valid 10-character PAN number (e.g., ABCDE1234F)" className="input w-full font-mono uppercase" value={formData.panNo} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">MSME Number</label>
                <input name="msmeNo" className="input w-full font-mono uppercase" value={formData.msmeNo} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">ISO Certification</label>
                <input name="isoNo" className="input w-full font-mono uppercase" value={formData.isoNo} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Electrical License (If applicable)</label>
                <input name="electricalLicense" className="input w-full font-mono" value={formData.electricalLicense} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">EPF Number</label>
                <input name="epfNo" className="input w-full font-mono uppercase" value={formData.epfNo} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">ESI Number</label>
                <input name="esiNo" className="input w-full font-mono uppercase" value={formData.esiNo} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* Bank Details */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                <input name="bankName" className="input w-full" value={formData.bankName} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Account Holder</label>
                <input name="accountHolder" className="input w-full" value={formData.accountHolder} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Account Number</label>
                <input name="accountNumber" pattern="^\d{9,18}$" title="Account number must be 9 to 18 digits" className="input w-full font-mono" value={formData.accountNumber} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">IFSC Code</label>
                <input name="ifscCode" pattern="^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$" title="Please enter a valid 11-character IFSC code (e.g., HDFC0001234)" className="input w-full font-mono uppercase" value={formData.ifscCode} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* Controls */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Management Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Status</label>
                <select name="status" className="input w-full bg-white" value={formData.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Credit Limit (₹)</label>
                <input type="number" name="creditLimit" className="input w-full font-mono" value={formData.creditLimit} onChange={handleChange} />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <input 
                    type="checkbox" 
                    id="isPreferred" 
                    name="isPreferred"
                    checked={formData.isPreferred} 
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" 
                />
                <label htmlFor="isPreferred" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">
                    Preferred Vendor (PVL)
                </label>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] pb-2 -mx-6 px-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-800 transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
            <button type="submit" disabled={isSaving} className={`btn-primary flex items-center gap-2 px-8 ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Processing...' : (isEditing ? 'Update Vendor' : 'Complete Onboarding')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
