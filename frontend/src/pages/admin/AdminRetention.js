import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, Calendar, User, CheckCircle, XCircle, RefreshCw, Clock, ShoppingCart, MessageCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AdminRetention() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(15);
  const [noteModal, setNoteModal] = useState(null);
  const [noteStatus, setNoteStatus] = useState('interested');
  const [noteText, setNoteText] = useState('');
  const adminToken = sessionStorage.getItem('adminToken');
  const headers = { 'X-Admin-Token': adminToken };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/retention/customers?days=${days}`, { headers });
      setCustomers(res.data.customers || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (!adminToken) { navigate('/admin'); return; }
    fetchCustomers();
  }, [days]);

  const saveNote = async () => {
    if (!noteModal) return;
    try {
      await axios.post(`${API}/admin/retention/note`, {
        order_id: noteModal.order_id,
        status: noteStatus,
        notes: noteText
      }, { headers });
      setNoteModal(null);
      setNoteText('');
      fetchCustomers();
    } catch (err) { alert('Failed to save'); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'interested': return 'bg-green-100 text-green-700';
      case 'not_interested': return 'bg-red-100 text-red-700';
      case 'reorder': return 'bg-blue-100 text-blue-700';
      case 'callback': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-green-500" /></div>;

  return (
    <div className="space-y-6" data-testid="admin-retention">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Retention</h1>
          <p className="text-gray-500 text-sm">Follow up with customers after purchase</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDays(15)} className={`px-4 py-2 rounded-xl text-sm font-medium ${days === 15 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>15 Days</button>
          <button onClick={() => setDays(30)} className={`px-4 py-2 rounded-xl text-sm font-medium ${days === 30 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>30 Days</button>
          <button onClick={fetchCustomers} className="p-2 hover:bg-gray-100 rounded-xl"><RefreshCw size={18} /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No customers due for {days}-day follow-up</td></tr>
            ) : customers.map((c, i) => (
              <tr key={c.order_id || i} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{c.order_id}</p>
                  <p className="text-xs text-gray-500">₹{c.amount}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {c.retention_note ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.retention_note.status)}`}>
                      {c.retention_note.status}
                    </span>
                  ) : <span className="text-xs text-gray-400">Pending</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`tel:${c.phone}`} className="p-1.5 hover:bg-green-50 rounded-lg" title="Call"><Phone size={16} className="text-green-600" /></a>
                    <a href={`https://wa.me/91${c.phone?.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-green-50 rounded-lg" title="WhatsApp"><MessageCircle size={16} className="text-green-600" /></a>
                    <button onClick={() => setNoteModal(c)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 text-xs font-medium">Note</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Follow-up Note</h3>
            <p className="text-sm text-gray-500 mb-4">{noteModal.name} - {noteModal.phone}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[{v:'interested',l:'Interested',c:'green'},{v:'not_interested',l:'Not Interested',c:'red'},{v:'reorder',l:'Reorder',c:'blue'},{v:'callback',l:'Callback Later',c:'yellow'}].map(opt => (
                <button key={opt.v} onClick={() => setNoteStatus(opt.v)} className={`px-3 py-2 rounded-xl text-sm font-medium border-2 ${noteStatus === opt.v ? `border-${opt.c}-500 bg-${opt.c}-50 text-${opt.c}-700` : 'border-gray-200 text-gray-600'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add notes..." className="w-full px-3 py-2 border rounded-xl text-sm mb-4" rows={3} />
            <div className="flex gap-2">
              <button onClick={saveNote} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl">Save</button>
              <button onClick={() => setNoteModal(null)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRetention;
