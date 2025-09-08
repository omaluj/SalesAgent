import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';

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
  _count: {
    campaignCompanies: number;
  };
}

interface Template {
  id: string;
  name: string;
  category?: string;
  active: boolean;
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    templateId: '',
    startDate: '',
    endDate: '',
    maxEmailsPerDay: 50,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/campaigns');
      console.log('Campaigns API response:', response.data);
      setCampaigns(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError('Chyba pri načítavaní kampaní: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/api/enhanced-templates');
      console.log('Templates API response:', response.data);
      setTemplates(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/api/campaigns', newCampaign);
      console.log('Create campaign response:', response.data);
      setShowCreateForm(false);
      setNewCampaign({
        name: '',
        description: '',
        templateId: '',
        startDate: '',
        endDate: '',
        maxEmailsPerDay: 50,
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError('Chyba pri vytváraní kampane: ' + (err.response?.data?.error || err.message));
    }
  };

  const activateCampaign = async (id: string) => {
    try {
      await apiClient.post(`/api/campaigns/${id}/activate`);
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error activating campaign:', err);
      setError('Chyba pri aktivácii kampane: ' + (err.response?.data?.error || err.message));
    }
  };

  const pauseCampaign = async (id: string) => {
    try {
      await apiClient.post(`/api/campaigns/${id}/pause`);
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error pausing campaign:', err);
      setError('Chyba pri pozastavení kampane: ' + (err.response?.data?.error || err.message));
    }
  };

  const editCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setNewCampaign({
      name: campaign.name,
      description: campaign.description || '',
      templateId: campaign.template.id,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      maxEmailsPerDay: 50, // Default value since it's not in the interface
    });
    setShowEditForm(true);
  };

  const updateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    
    try {
      await apiClient.put(`/api/campaigns/${editingCampaign.id}`, newCampaign);
      setShowEditForm(false);
      setEditingCampaign(null);
      setNewCampaign({
        name: '',
        description: '',
        templateId: '',
        startDate: '',
        endDate: '',
        maxEmailsPerDay: 50,
      });
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error updating campaign:', err);
      setError('Chyba pri aktualizácii kampane: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítavam kampane...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email Kampane</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nová kampaň
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Debug info */}
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h3 className="font-semibold mb-2">Debug informácie:</h3>
        <p>Počet kampaní: {campaigns.length}</p>
        <p>Počet šablón: {templates.length}</p>
        {campaigns.length > 0 && (
          <div>
            <p>Prvá kampaň: {campaigns[0].name}</p>
            <p>Status: {campaigns[0].status}</p>
          </div>
        )}
      </div>

      {/* Campaigns list */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Žiadne kampane neboli nájdené. Vytvorte prvú kampaň.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-gray-600 mt-1">{campaign.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Šablóna: {campaign.template.name}</p>
                    <p>Dátum: {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</p>
                    <p>Firmy: {campaign._count.campaignCompanies}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    campaign.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                  <button
                    onClick={() => editCampaign(campaign)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Upraviť
                  </button>
                  {campaign.status === 'ACTIVE' ? (
                    <button
                      onClick={() => pauseCampaign(campaign.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                    >
                      Pozastaviť
                    </button>
                  ) : (
                    <button
                      onClick={() => activateCampaign(campaign.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Aktivovať
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create campaign modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nová kampaň</h2>
            <form onSubmit={createCampaign}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Názov kampane
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Popis
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Šablóna
                </label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Vyberte šablónu</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Začiatok
                </label>
                <input
                  type="date"
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Koniec
                </label>
                <input
                  type="date"
                  value={newCampaign.endDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max emailov/deň
                </label>
                <input
                  type="number"
                  value={newCampaign.maxEmailsPerDay}
                  onChange={(e) => setNewCampaign({ ...newCampaign, maxEmailsPerDay: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Vytvoriť
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Zrušiť
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit campaign modal */}
      {showEditForm && editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upraviť kampaň</h2>
            <form onSubmit={updateCampaign}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Názov kampane
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Popis
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Šablóna
                </label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Vyberte šablónu</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Začiatok
                </label>
                <input
                  type="date"
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Koniec
                </label>
                <input
                  type="date"
                  value={newCampaign.endDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max emailov/deň
                </label>
                <input
                  type="number"
                  value={newCampaign.maxEmailsPerDay}
                  onChange={(e) => setNewCampaign({ ...newCampaign, maxEmailsPerDay: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Uložiť zmeny
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingCampaign(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Zrušiť
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
