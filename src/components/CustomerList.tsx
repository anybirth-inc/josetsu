import React from 'react';
import { Edit2, Trash2, MapPin } from 'lucide-react';
import type { Customer, SearchParams } from '../types';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onShowOnMap: (customer: Customer) => void;
}

// 全角から半角への変換関数を追加
const toHalfWidth = (str: string): string => {
  return str
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[‐－―ー]/g, '-');
};

// 郵便番号のフォーマット関数
const formatPostalCode = (value: string): string => {
  // 全角を半角に変換
  const half = toHalfWidth(value);
  // 数字とハイフン以外を削除
  const numbers = half.replace(/[^0-9-]/g, '');
  // ハイフンを削除
  return numbers.replace(/-/g, '');
};

export function CustomerList({ customers, onEdit, onDelete, onShowOnMap }: CustomerListProps) {
  const [sortField, setSortField] = React.useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [searchParams, setSearchParams] = React.useState<SearchParams>({});

  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedCustomers = React.useMemo(() => {
    let filtered = customers;

    // Apply filters
    if (searchParams.name) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchParams.name!.toLowerCase()));
    }
    if (searchParams.postal_code) {
      filtered = filtered.filter(c => c.postal_code.includes(searchParams.postal_code!));
    }
    if (searchParams.address) {
      filtered = filtered.filter(c => c.address.toLowerCase().includes(searchParams.address!.toLowerCase()));
    }
    if (searchParams.phone) {
      filtered = filtered.filter(c => c.phone.includes(searchParams.phone!));
    }
    if (searchParams.contract_type) {
      filtered = filtered.filter(c => c.contract_type === searchParams.contract_type);
    }

    // Sort
    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, searchParams, sortField, sortDirection]);

  return (
    <div className="bg-white shadow-md rounded-lg">
      <div className="p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="名前で検索"
            value={searchParams.name || ''}
            onChange={e => setSearchParams(prev => ({ ...prev, name: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="郵便番号で検索（例：123-4567）"
            value={searchParams.postal_code || ''}
            onChange={e => setSearchParams(prev => ({ ...prev, postal_code: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="住所で検索"
            value={searchParams.address || ''}
            onChange={e => setSearchParams(prev => ({ ...prev, address: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="電話番号で検索"
            value={searchParams.phone || ''}
            onChange={e => setSearchParams(prev => ({ ...prev, phone: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <select
            value={searchParams.contract_type || ''}
            onChange={e => setSearchParams(prev => ({ ...prev, contract_type: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">契約タイプ</option>
            <option value="basic">基本プラン</option>
            <option value="premium">プレミアムプラン</option>
            <option value="custom">カスタムプラン</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                名前
                {sortField === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th
                onClick={() => handleSort('postal_code')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                郵便番号
                {sortField === 'postal_code' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th
                onClick={() => handleSort('address')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                住所
                {sortField === 'address' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電話番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                契約タイプ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                請求金額
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedCustomers.map(customer => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{customer.postal_code}</td>
                <td className="px-6 py-4">{customer.address}</td>
                <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${customer.contract_type === 'premium' ? 'bg-green-100 text-green-800' :
                      customer.contract_type === 'basic' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {customer.contract_type === 'premium' ? 'プレミアム' :
                     customer.contract_type === 'basic' ? '基本' : 'カスタム'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ¥{customer.billing_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => onShowOnMap(customer)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}