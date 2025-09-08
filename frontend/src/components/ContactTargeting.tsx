import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from '../config/axios';

interface ContactSearchFilters {
  industry?: string;
  location?: string;
  size?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  status?: string;
  limit?: number;
}

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: string;
  email: string;
  phone: string;
  contactName: string;
  contactPosition: string;
  status: string;
  createdAt: string;
}

interface DiscoveryRequest {
  industries: string[];
  location: string;
  maxCompaniesPerIndustry: number;
}

const ContactTargeting: React.FC = () => {
  const [searchFilters, setSearchFilters] = useState<ContactSearchFilters>({
    location: 'Slovakia',
    status: 'PENDING',
    limit: 20
  });
  const [discoveryRequest, setDiscoveryRequest] = useState<DiscoveryRequest>({
    industries: [],
    location: 'Slovakia',
    maxCompaniesPerIndustry: 10
  });
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);

  const queryClient = useQueryClient();

  // Fetch available industries
  const { data: industries = [] } = useQuery('industries', async () => {
    const response = await axios.get('/api/contacts/industries');
    return response.data.data;
  });

  // Fetch available locations
  const { data: locations = [] } = useQuery('locations', async () => {
    const response = await axios.get('/api/contacts/locations');
    return response.data.data;
  });

  // Fetch contact statistics
  const { data: stats } = useQuery('contact-stats', async () => {
    const response = await axios.get('/api/contacts/stats');
    return response.data.data;
  });

  // Search contacts mutation
  const searchContactsMutation = useMutation(async (filters: ContactSearchFilters) => {
    const response = await axios.get('/api/contacts/search', { params: filters });
    return response.data.data;
  });

  // Discover companies mutation
  const discoverCompaniesMutation = useMutation(async (request: DiscoveryRequest) => {
    const response = await axios.post('/api/contacts/discover', request);
    return response.data.data;
  });

  const handleSearch = () => {
    searchContactsMutation.mutate(searchFilters);
  };

  const handleDiscover = async () => {
    if (discoveryRequest.industries.length === 0) {
      alert('Prosím vyberte aspoň jedno odvetvie');
      return;
    }

    setIsDiscovering(true);
    try {
      const result = await discoverCompaniesMutation.mutateAsync(discoveryRequest);
      alert(`Objavené ${result.totalDiscovered} firiem, uložené ${result.totalSaved}`);
      queryClient.invalidateQueries('contact-stats');
    } catch (error) {
      console.error('Discovery failed:', error);
      alert('Objavovanie firiem zlyhalo');
    } finally {
      setIsDiscovering(false);
    }
  };

  const addIndustryToDiscovery = () => {
    if (selectedIndustry && !discoveryRequest.industries.includes(selectedIndustry)) {
      setDiscoveryRequest(prev => ({
        ...prev,
        industries: [...prev.industries, selectedIndustry]
      }));
      setSelectedIndustry('');
    }
  };

  const removeIndustryFromDiscovery = (industry: string) => {
    setDiscoveryRequest(prev => ({
      ...prev,
      industries: prev.industries.filter(i => i !== industry)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Targeting & Search</h1>
        <p className="text-gray-600">Nastavte kritériá pre vyhľadávanie a objavovanie nových kontaktov</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Celkom firiem</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCompanies}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Nové (24h)</h3>
            <p className="text-3xl font-bold text-green-600">{stats.recentDiscoveries}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Čakajúce</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.companiesByStatus.PENDING || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Kontaktované</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.companiesByStatus.CONTACTED || 0}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vyhľadávanie existujúcich kontaktov</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Odvetvie</label>
              <select
                value={searchFilters.industry || ''}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, industry: e.target.value || undefined }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Všetky odvetvia</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lokalita</label>
              <select
                value={searchFilters.location || ''}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veľkosť firmy</label>
              <select
                value={searchFilters.size || ''}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, size: e.target.value || undefined }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Všetky veľkosti</option>
                <option value="small">Malé (1-10 zamestnancov)</option>
                <option value="medium">Stredné (11-50 zamestnancov)</option>
                <option value="large">Veľké (50+ zamestnancov)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={searchFilters.status || ''}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PENDING">Čakajúce</option>
                <option value="CONTACTED">Kontaktované</option>
                <option value="RESPONDED">Odpovedali</option>
                <option value="MEETING_SCHEDULED">Stretnutie naplánované</option>
                <option value="CONVERTED">Konvertované</option>
                <option value="REJECTED">Odmietnuté</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchFilters.hasEmail || false}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, hasEmail: e.target.checked || undefined }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Má email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchFilters.hasPhone || false}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, hasPhone: e.target.checked || undefined }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Má telefón</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limit výsledkov</label>
              <input
                type="number"
                value={searchFilters.limit || 20}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="100"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={searchContactsMutation.isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchContactsMutation.isLoading ? 'Vyhľadávam...' : 'Vyhľadať kontakty'}
            </button>
          </div>
        </div>

        {/* Discovery Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Objavovanie nových firiem</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Odvetvia</label>
              <div className="flex space-x-2 mb-2">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Vyberte odvetvie</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                <button
                  onClick={addIndustryToDiscovery}
                  disabled={!selectedIndustry}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pridať
                </button>
              </div>
              
              {discoveryRequest.industries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {discoveryRequest.industries.map(industry => (
                    <span
                      key={industry}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {industry}
                      <button
                        onClick={() => removeIndustryFromDiscovery(industry)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lokalita</label>
              <select
                value={discoveryRequest.location}
                onChange={(e) => setDiscoveryRequest(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max. firiem na odvetvie</label>
              <input
                type="number"
                value={discoveryRequest.maxCompaniesPerIndustry}
                onChange={(e) => setDiscoveryRequest(prev => ({ ...prev, maxCompaniesPerIndustry: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="50"
              />
            </div>

            <button
              onClick={handleDiscover}
              disabled={isDiscovering || discoveryRequest.industries.length === 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiscovering ? 'Objavujem firmy...' : 'Objaviť nové firmy'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchContactsMutation.data && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Výsledky vyhľadávania ({searchContactsMutation.data.total} firiem)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odvetvie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dátum</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchContactsMutation.data.companies.map((company: Company) => (
                  <tr key={company.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.website}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {company.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.contactName}</div>
                      <div className="text-sm text-gray-500">{company.contactPosition}</div>
                      <div className="text-sm text-gray-500">{company.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        company.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                        company.status === 'RESPONDED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.createdAt).toLocaleDateString('sk-SK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactTargeting;
