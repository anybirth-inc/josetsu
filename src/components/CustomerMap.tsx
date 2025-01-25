import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Search, Filter } from 'lucide-react';
import type { Customer } from '../types';

interface CustomerMapProps {
  customers: Customer[];
  apiKey: string;
  onCustomerSelect?: (customer: Customer) => void;
}

interface FilterOptions {
  contractType: string;
  minSnowArea: string;
  maxSnowArea: string;
  minBilling: string;
  maxBilling: string;
}

export function CustomerMap({ customers, apiKey, onCustomerSelect }: CustomerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [activeInfoWindow, setActiveInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    contractType: '',
    minSnowArea: '',
    maxSnowArea: '',
    minBilling: '',
    maxBilling: ''
  });

  useEffect(() => {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    loader.load().then(() => {
      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 35.6762, lng: 139.6503 },
          zoom: 12,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
        setMap(map);

        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true
        });
        setDirectionsRenderer(directionsRenderer);
      }
    });
  }, [apiKey]);

  const filteredCustomers = customers.filter(customer => {
    // 検索クエリでフィルタリング
    const matchesSearch = !searchQuery || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchQuery.toLowerCase());

    // フィルター条件でフィルタリング
    const matchesContractType = !filters.contractType || customer.contract_type === filters.contractType;
    const matchesSnowArea = (!filters.minSnowArea || customer.snow_removal_area >= Number(filters.minSnowArea)) &&
                           (!filters.maxSnowArea || customer.snow_removal_area <= Number(filters.maxSnowArea));
    const matchesBilling = (!filters.minBilling || customer.billing_amount >= Number(filters.minBilling)) &&
                          (!filters.maxBilling || customer.billing_amount <= Number(filters.maxBilling));

    return matchesSearch && matchesContractType && matchesSnowArea && matchesBilling;
  });

  useEffect(() => {
    if (!map) return;

    // Clear existing markers and info windows
    markers.forEach(marker => marker.setMap(null));
    if (activeInfoWindow) {
      activeInfoWindow.close();
    }

    // Create new markers
    const newMarkers = filteredCustomers
      .filter(customer => customer.lat != null && customer.lng != null)
      .map(customer => {
        // カスタムマーカーのSVG
        const markerSvg = {
          path: 'M12 0C7.58 0 4 3.58 4 8c0 5.76 7.44 14.32 7.75 14.71.15.19.38.29.62.29.24 0 .47-.1.62-.29C13.56 22.32 21 13.76 21 8c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
          fillColor: customer.contract_type === 'premium' ? '#DC2626' : // red-600
                    customer.contract_type === 'basic' ? '#DC2626' : // red-600
                    '#DC2626', // red-600
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 1.5,
          anchor: new google.maps.Point(12, 24),
        };

        const marker = new google.maps.Marker({
          position: { lat: customer.lat!, lng: customer.lng! },
          map,
          title: customer.name,
          icon: markerSvg,
          animation: google.maps.Animation.DROP
        });

        const contractTypeText = {
          premium: 'プレミアムプラン',
          basic: '基本プラン',
          custom: 'カスタムプラン'
        }[customer.contract_type];

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-4 min-w-[300px]">
              <h3 class="text-lg font-bold mb-2">${customer.name}</h3>
              <div class="space-y-2">
                <p class="flex items-center">
                  <span class="font-semibold w-24">住所:</span>
                  <span>${customer.address}</span>
                </p>
                <p class="flex items-center">
                  <span class="font-semibold w-24">電話番号:</span>
                  <span>${customer.phone || '未設定'}</span>
                </p>
                <p class="flex items-center">
                  <span class="font-semibold w-24">契約タイプ:</span>
                  <span>${contractTypeText}</span>
                </p>
                <p class="flex items-center">
                  <span class="font-semibold w-24">除雪範囲:</span>
                  <span>${customer.snow_removal_area}m²</span>
                </p>
                <p class="flex items-center">
                  <span class="font-semibold w-24">請求金額:</span>
                  <span>¥${customer.billing_amount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          if (activeInfoWindow) {
            activeInfoWindow.close();
          }
          infoWindow.open(map, marker);
          setActiveInfoWindow(infoWindow);
          onCustomerSelect?.(customer);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()!));
      map.fitBounds(bounds);
    }
  }, [map, filteredCustomers, onCustomerSelect]);

  const calculateRoute = async () => {
    if (!map || !directionsRenderer || selectedCustomers.length < 2) return;

    const directionsService = new google.maps.DirectionsService();

    const origin = selectedCustomers[0];
    const destination = selectedCustomers[selectedCustomers.length - 1];
    const waypoints = selectedCustomers.slice(1, -1).map(customer => ({
      location: { lat: customer.lat!, lng: customer.lng! },
      stopover: true
    }));

    try {
      const result = await directionsService.route({
        origin: { lat: origin.lat!, lng: origin.lng! },
        destination: { lat: destination.lat!, lng: destination.lng! },
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
      });

      directionsRenderer.setDirections(result);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white border-b">
        <div className="space-y-4">
          {/* 検索バー */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="顧客名や住所で検索..."
                className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* フィルターパネル */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-md space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">契約タイプ</label>
                  <select
                    value={filters.contractType}
                    onChange={(e) => setFilters(prev => ({ ...prev, contractType: e.target.value }))}
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">すべて</option>
                    <option value="basic">基本プラン</option>
                    <option value="premium">プレミアムプラン</option>
                    <option value="custom">カスタムプラン</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">除雪範囲 (m²)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={filters.minSnowArea}
                      onChange={(e) => setFilters(prev => ({ ...prev, minSnowArea: e.target.value }))}
                      placeholder="最小"
                      className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={filters.maxSnowArea}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxSnowArea: e.target.value }))}
                      placeholder="最大"
                      className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">請求金額 (円)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={filters.minBilling}
                      onChange={(e) => setFilters(prev => ({ ...prev, minBilling: e.target.value }))}
                      placeholder="最小"
                      className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={filters.maxBilling}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxBilling: e.target.value }))}
                      placeholder="最大"
                      className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      contractType: '',
                      minSnowArea: '',
                      maxSnowArea: '',
                      minBilling: '',
                      maxBilling: ''
                    })}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    フィルターをリセット
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ルート計算用の顧客選択 */}
          <div className="flex space-x-4">
            <select
              multiple
              value={selectedCustomers.map(c => c.id)}
              onChange={(e) => {
                const selectedIds = Array.from(e.target.selectedOptions).map(option => option.value);
                const selected = filteredCustomers.filter(c => selectedIds.includes(c.id));
                setSelectedCustomers(selected);
              }}
              className="w-64 rounded-md border-gray-300"
              size={5}
            >
              {filteredCustomers
                .filter(customer => customer.lat != null && customer.lng != null)
                .map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
            </select>
            <button
              onClick={calculateRoute}
              disabled={selectedCustomers.length < 2}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed h-fit"
            >
              ルート表示
            </button>
          </div>
        </div>
      </div>
      <div ref={mapRef} className="flex-1 min-h-[500px]" />
    </div>
  );
}