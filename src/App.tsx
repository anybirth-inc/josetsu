import React, { useState } from 'react';
import { CustomerForm } from './components/CustomerForm';
import { CustomerList } from './components/CustomerList';
import { CustomerMap } from './components/CustomerMap';
import type { Customer } from './types';
import { Plus, List, Map } from 'lucide-react';

// 環境変数からAPIキーを取得
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const handleSubmit = async (data: Partial<Customer>) => {
    if (selectedCustomer) {
      // Update existing customer
      const updated = {
        ...selectedCustomer,
        ...data,
        updated_at: new Date().toISOString()
      };
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name || '',
        postal_code: data.postal_code || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        contract_type: data.contract_type || 'basic',
        snow_removal_area: data.snow_removal_area || 0,
        contract_start_date: data.contract_start_date || '',
        contract_end_date: data.contract_end_date || '',
        billing_amount: data.billing_amount || 0,
        lat: data.lat || 0,
        lng: data.lng || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCustomers(prev => [...prev, newCustomer]);
    }
    setShowForm(false);
    setSelectedCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = (customer: Customer) => {
    if (window.confirm('本当にこの顧客を削除しますか？')) {
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setSelectedCustomer(null);
    }
  };

  const handleShowOnMap = (customer: Customer) => {
    setView('map');
    setSelectedCustomer(customer);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">除雪顧客管理システム</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md flex items-center ${
                  view === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-4 py-2 rounded-md flex items-center ${
                  view === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Map className="h-5 w-5" />
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                新規顧客
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && (
          <div className="mb-8">
            <CustomerForm
              initialData={selectedCustomer || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        )}
        {!showForm && view === 'list' && (
          <CustomerList
            customers={customers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShowOnMap={handleShowOnMap}
          />
        )}
        {!showForm && view === 'map' && (
          <CustomerMap
            customers={customers}
            apiKey={GOOGLE_MAPS_API_KEY}
            onCustomerSelect={setSelectedCustomer}
          />
        )}
      </main>
    </div>
  );
}

export default App;