import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from '../config/axios';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  template: {
    id: string;
    name: string;
  };
  targetIndustries: string[];
  targetSizes: string[];
  targetRegions: string[];
  _count: {
    campaignCompanies: number;
  };
}

interface Template {
  id: string;
  name: string;
  category?: string;
  active: boolean;
  targetIndustries: string[];
  targetSizes: string[];
}

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
}

const CampaignWithTargeting: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTargetingForm, setShowTargetingForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    templateId: '',
    startDate: '',
    endDate: '',
    maxEmailsPerDay: 50,
    targetIndustries: [] as string[],
    targetSizes: [] as string[],
    targetRegions: [] as string[],
  });
  const [targetingFilters, setTargetingFilters] = useState<ContactSearchFilters>({
    location: 'Slovakia',
    status: 'PENDING',
    limit: 50
  });
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);

  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery('campaigns', async () => {
    const response = await axios.get('/api/campaigns');
    return response.data.data;
  });

  // Fetch templates
  const { data: templates = [] } = useQuery('templates', async () => {
    const response = await axios.get('/api/enhanced-templates');
    return response.data.data;
  });

  // Fetch industries
  const { data: industries = [] } = useQuery('industries', async () => {
    const response = await axios.get('/api/contacts/industries');
    return response.data.data;
  });

  // Fetch locations
  const { data: locations = [] } = useQuery('locations', async () => {
    const response = await axios.get('/api/contacts/locations');
    return response.data.data;
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation(async (campaignData: any) => {
    const response = await axios.post('/api/campaigns', campaignData);
    return response.data.data;
  });

  // Search contacts mutation
  const searchContactsMutation = useMutation(async (filters: ContactSearchFilters) => {
    const response = await axios.get('/api/contacts/search', { params: filters });
    return response.data.data;
  });

  // Add companies to campaign mutation
  const addCompaniesToCampaignMutation = useMutation(async ({ campaignId, companyIds }: { campaignId: string, companyIds: string[] }) => {
    const response = await axios.post(`/api/campaigns/${campaignId}/companies`, { companyIds });
    return response.data.data;
  });

  // Send campaign emails mutation
  const sendCampaignEmailsMutation = useMutation(async (campaignId: string) => {
    const response = await axios.post(`/api/campaigns/${campaignId}/send-emails`);
    return response.data.data;
  });

  // Get campaign companies mutation
  const getCampaignCompaniesMutation = useMutation(async (campaignId: string) => {
    const response = await axios.get(`/api/campaigns/${campaignId}/companies`);
    return response.data.data;
  });

  // Get campaign analytics mutation
  const getCampaignAnalyticsMutation = useMutation(async (campaignId: string) => {
    const response = await axios.get(`/api/campaigns/${campaignId}/analytics`);
    return response.data.data;
  });

  // Start/stop automation mutations
  const startAutomationMutation = useMutation(async (campaignId: string) => {
    const response = await axios.post(`/api/campaigns/${campaignId}/start-automation`);
    return response.data;
  });

  const stopAutomationMutation = useMutation(async (campaignId: string) => {
    const response = await axios.post(`/api/campaigns/${campaignId}/stop-automation`);
    return response.data;
  });

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaignMutation.mutateAsync(newCampaign);
      setShowCreateForm(false);
      setNewCampaign({
        name: '',
        description: '',
        templateId: '',
        startDate: '',
        endDate: '',
        maxEmailsPerDay: 50,
        targetIndustries: [],
        targetSizes: [],
        targetRegions: [],
      });
      queryClient.invalidateQueries('campaigns');
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleSearchContacts = () => {
    searchContactsMutation.mutate(targetingFilters);
  };

  const handleAddCompaniesToCampaign = async () => {
    if (!selectedCampaign || selectedCompanies.length === 0) return;

    try {
      await addCompaniesToCampaignMutation.mutateAsync({
        campaignId: selectedCampaign.id,
        companyIds: selectedCompanies.map(c => c.id)
      });
      setShowTargetingForm(false);
      setSelectedCompanies([]);
      queryClient.invalidateQueries('campaigns');
      alert(`Pridaných ${selectedCompanies.length} firiem do kampane "${selectedCampaign.name}"`);
    } catch (error) {
      console.error('Failed to add companies to campaign:', error);
      alert('Chyba pri pridávaní firiem do kampane');
    }
  };

  const toggleCompanySelection = (company: Company) => {
    setSelectedCompanies(prev => {
      const isSelected = prev.some(c => c.id === company.id);
      if (isSelected) {
        return prev.filter(c => c.id !== company.id);
      } else {
        return [...prev, company];
      }
    });
  };

  const selectAllCompanies = () => {
    if (searchContactsMutation.data?.companies) {
      setSelectedCompanies(searchContactsMutation.data.companies);
    }
  };

  const clearSelection = () => {
    setSelectedCompanies([]);
  };

  const handleSendCampaignEmails = async (campaignId: string) => {
    if (!confirm('Naozaj chcete odoslať emaily na všetky firmy v tejto kampani?')) {
      return;
    }

    try {
      const result = await sendCampaignEmailsMutation.mutateAsync(campaignId);
      alert(`Úspešne zaradené ${result.emailsQueued} emailov do fronty. ${result.errors > 0 ? `${result.errors} chýb.` : ''}`);
      queryClient.invalidateQueries('campaigns');
    } catch (error) {
      console.error('Failed to send campaign emails:', error);
      alert('Chyba pri odosielaní emailov kampane');
    }
  };

  const handleViewCampaignCompanies = async (campaignId: string) => {
    try {
      const companies = await getCampaignCompaniesMutation.mutateAsync(campaignId);
      // Show companies in a modal or alert
      const companyList = companies.map((cc: any) => 
        `${cc.company.name} (${cc.company.email || cc.company.contactEmail || 'bez emailu'}) - ${cc.status}`
      ).join('\n');
      alert(`Firmy v kampani (${companies.length}):\n\n${companyList}`);
    } catch (error) {
      console.error('Failed to get campaign companies:', error);
      alert('Chyba pri načítavaní firiem kampane');
    }
  };

  const handleViewAnalytics = async (campaignId: string) => {
    try {
      const analytics = await getCampaignAnalyticsMutation.mutateAsync(campaignId);
      const { totals, rates } = analytics;
      
      const analyticsText = `
📊 ANALYTIKA KAMPANE

📈 ZÁKLADNÉ METRIKY:
• Objavené firmy: ${totals.companiesDiscovered}
• Kontaktované firmy: ${totals.companiesContacted}
• Odpovede: ${totals.companiesResponded}
• Odoslané emaily: ${totals.emailsSent}
• Doručené emaily: ${totals.emailsDelivered}
• Otvorené emaily: ${totals.emailsOpened}
• Kliknuté emaily: ${totals.emailsClicked}

🎯 LEADY A STRETNUTIA:
• Vygenerované leady: ${totals.leadsGenerated}
• Naplánované stretnutia: ${totals.meetingsScheduled}
• Dokončené stretnutia: ${totals.meetingsCompleted}

📊 ÚSPEŠNOSŤ:
• Response rate: ${rates.responseRate.toFixed(1)}%
• Open rate: ${rates.openRate.toFixed(1)}%
• Click rate: ${rates.clickRate.toFixed(1)}%
• Lead rate: ${rates.leadRate.toFixed(1)}%
• Meeting rate: ${rates.meetingRate.toFixed(1)}%
      `;
      
      alert(analyticsText);
    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      alert('Chyba pri načítavaní analytiky kampane');
    }
  };

  const handleStartAutomation = async (campaignId: string) => {
    if (!confirm('Naozaj chcete spustiť automatizáciu tejto kampane?')) {
      return;
    }

    try {
      await startAutomationMutation.mutateAsync(campaignId);
      alert('Automatizácia kampane bola spustená!');
      queryClient.invalidateQueries('campaigns');
    } catch (error) {
      console.error('Failed to start automation:', error);
      alert('Chyba pri spúšťaní automatizácie kampane');
    }
  };

  const handleStopAutomation = async (campaignId: string) => {
    if (!confirm('Naozaj chcete zastaviť automatizáciu tejto kampane?')) {
      return;
    }

    try {
      await stopAutomationMutation.mutateAsync(campaignId);
      alert('Automatizácia kampane bola zastavená!');
      queryClient.invalidateQueries('campaigns');
    } catch (error) {
      console.error('Failed to stop automation:', error);
      alert('Chyba pri zastavovaní automatizácie kampane');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Kampane s Contact Targeting</h1>
        <p className="text-gray-600">Vytvárajte kampane a cielené vyhľadávajte kontakty</p>
      </div>

      {/* Campaign List */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Aktívne kampane</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Vytvoriť novú kampaň
          </button>
        </div>

        {campaignsLoading ? (
          <div className="text-center py-8">Načítavam kampane...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign: Campaign) => (
              <div key={campaign.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        {campaign.template.name}
                      </span>
                      <span>{campaign._count.campaignCompanies} firiem</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(campaign.startDate).toLocaleDateString('sk-SK')} - {new Date(campaign.endDate).toLocaleDateString('sk-SK')}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {campaign.targetIndustries.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Odvetvia:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.targetIndustries.map(industry => (
                          <span key={industry} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {campaign.targetSizes.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Veľkosti:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.targetSizes.map(size => (
                          <span key={size} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowTargetingForm(true);
                    }}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
                  >
                    🎯 Pridať kontakty
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleViewCampaignCompanies(campaign.id)}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
                    >
                      👥 Firmy ({campaign._count.campaignCompanies})
                    </button>
                    <button
                      onClick={() => handleViewAnalytics(campaign.id)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                    >
                      📊 Analytika
                    </button>
                    <button
                      onClick={() => handleSendCampaignEmails(campaign.id)}
                      className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                    >
                      📧 Odoslať
                    </button>
                    {campaign.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStopAutomation(campaign.id)}
                        className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm"
                      >
                        ⏸️ Zastaviť
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartAutomation(campaign.id)}
                        className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
                      >
                        ▶️ Spustiť
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Vytvoriť novú kampaň</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Názov kampane</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email šablóna</label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Vyberte šablónu</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Začiatok</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Koniec</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max. emailov za deň</label>
                <input
                  type="number"
                  value={newCampaign.maxEmailsPerDay}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, maxEmailsPerDay: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createCampaignMutation.isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {createCampaignMutation.isLoading ? 'Vytváram...' : 'Vytvoriť kampaň'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Zrušiť
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Targeting Modal */}
      {showTargetingForm && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Pridať kontakty do kampane: {selectedCampaign.name}
              </h2>
              <button
                onClick={() => setShowTargetingForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vyhľadávacie kritériá</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odvetvie</label>
                  <select
                    value={targetingFilters.industry || ''}
                    onChange={(e) => setTargetingFilters(prev => ({ ...prev, industry: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Všetky odvetvia</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokalita</label>
                  <select
                    value={targetingFilters.location || ''}
                    onChange={(e) => setTargetingFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veľkosť firmy</label>
                  <select
                    value={targetingFilters.size || ''}
                    onChange={(e) => setTargetingFilters(prev => ({ ...prev, size: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Všetky veľkosti</option>
                    <option value="small">Malé (1-10 zamestnancov)</option>
                    <option value="medium">Stredné (11-50 zamestnancov)</option>
                    <option value="large">Veľké (50+ zamestnancov)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={targetingFilters.hasEmail || false}
                      onChange={(e) => setTargetingFilters(prev => ({ ...prev, hasEmail: e.target.checked || undefined }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Má email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={targetingFilters.hasPhone || false}
                      onChange={(e) => setTargetingFilters(prev => ({ ...prev, hasPhone: e.target.checked || undefined }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Má telefón</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit výsledkov</label>
                  <input
                    type="number"
                    value={targetingFilters.limit || 50}
                    onChange={(e) => setTargetingFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="200"
                  />
                </div>

                <button
                  onClick={handleSearchContacts}
                  disabled={searchContactsMutation.isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchContactsMutation.isLoading ? 'Vyhľadávam...' : 'Vyhľadať kontakty'}
                </button>
              </div>

              {/* Search Results */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Výsledky vyhľadávania</h3>
                  {searchContactsMutation.data && (
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllCompanies}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Vybrať všetky
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Zrušiť výber
                      </button>
                    </div>
                  )}
                </div>

                {searchContactsMutation.data && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchContactsMutation.data.companies.map((company: Company) => (
                      <div
                        key={company.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCompanies.some(c => c.id === company.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleCompanySelection(company)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{company.name}</h4>
                            <p className="text-sm text-gray-600">{company.industry} • {company.size}</p>
                            <p className="text-sm text-gray-500">{company.contactName} - {company.contactPosition}</p>
                            <p className="text-sm text-blue-600">{company.email}</p>
                          </div>
                          <div className="ml-2">
                            {selectedCompanies.some(c => c.id === company.id) ? (
                              <span className="text-blue-600">✓</span>
                            ) : (
                              <span className="text-gray-400">○</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCompanies.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      Vybraté: {selectedCompanies.length} firiem
                    </p>
                    <button
                      onClick={handleAddCompaniesToCampaign}
                      disabled={addCompaniesToCampaignMutation.isLoading}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      {addCompaniesToCampaignMutation.isLoading ? 'Pridávam...' : `Pridať ${selectedCompanies.length} firiem do kampane`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignWithTargeting;
