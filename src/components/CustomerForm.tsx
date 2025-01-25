import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Calendar, DollarSign, Ruler } from 'lucide-react';
import type { Customer } from '../types';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface CustomerFormProps {
  initialData?: Partial<Customer>;
  onSubmit: (data: Partial<Customer>) => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>(initialData || {});
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    loader.load().then(() => {
      const geocoder = new google.maps.Geocoder();
      setGeocoder(geocoder);
    });
  }, []);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!geocoder) return null;

    try {
      const response = await geocoder.geocode({ address });
      if (response.results && response.results[0] && response.results[0].geometry) {
        const location = response.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get coordinates from address before submitting
    if (formData.address) {
      const coordinates = await geocodeAddress(formData.address);
      if (coordinates) {
        formData.lat = coordinates.lat;
        formData.lng = coordinates.lng;
      }
    }
    
    onSubmit(formData);
  };

  const handlePostalCodeChange = async (code: string) => {
    // まず入力値を更新
    setFormData(prev => ({
      ...prev,
      postal_code: code
    }));

    // 7桁の場合のみ住所検索を実行
    if (code.length === 7) {
      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`);
        const data = await response.json();
        if (data.results?.[0]) {
          const { address1, address2, address3 } = data.results[0];
          const fullAddress = `${address1}${address2}${address3}`;
          
          // 住所を更新
          setFormData(prev => ({
            ...prev,
            address: fullAddress
          }));

          // 座標を取得
          const coordinates = await geocodeAddress(fullAddress);
          if (coordinates) {
            setFormData(prev => ({
              ...prev,
              lat: coordinates.lat,
              lng: coordinates.lng
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch address or coordinates:', error);
      }
    }
  };

  const handleAddressChange = async (newAddress: string) => {
    setFormData(prev => ({ ...prev, address: newAddress }));
    
    if (newAddress.length > 5) { // Only geocode if address is long enough
      const coordinates = await geocodeAddress(newAddress);
      if (coordinates) {
        setFormData(prev => ({
          ...prev,
          lat: coordinates.lat,
          lng: coordinates.lng
        }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">郵便番号</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="text"
              value={formData.postal_code || ''}
              onChange={e => handlePostalCodeChange(e.target.value)}
              placeholder="1234567"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <MapPin className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="sm:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">住所</label>
          <input
            type="text"
            required
            value={formData.address || ''}
            onChange={e => handleAddressChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">電話番号</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <Phone className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <Mail className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">契約タイプ</label>
          <select
            value={formData.contract_type || 'basic'}
            onChange={e => setFormData(prev => ({ ...prev, contract_type: e.target.value as 'basic' | 'premium' | 'custom' }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
          >
            <option value="basic">基本プラン</option>
            <option value="premium">プレミアムプラン</option>
            <option value="custom">カスタムプラン</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">除雪範囲 (m²)</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="number"
              value={formData.snow_removal_area || ''}
              onChange={e => setFormData(prev => ({ ...prev, snow_removal_area: Number(e.target.value) }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <Ruler className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">契約開始日</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="date"
              value={formData.contract_start_date || ''}
              onChange={e => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <Calendar className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">契約終了日</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="date"
              value={formData.contract_end_date || ''}
              onChange={e => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <Calendar className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">請求金額</label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="number"
              value={formData.billing_amount || ''}
              onChange={e => setFormData(prev => ({ ...prev, billing_amount: Number(e.target.value) }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
            />
            <DollarSign className="ml-2 h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          保存
        </button>
      </div>
    </form>
  );
}