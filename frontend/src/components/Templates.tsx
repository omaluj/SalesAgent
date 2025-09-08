import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  category?: string;
  targetIndustries: string[];
  targetSizes: string[];
  seasonalStart?: string;
  seasonalEnd?: string;
  isSeasonal: boolean;
  active: boolean;
  _count: {
    campaigns: number;
  };
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    category: '',
    targetIndustries: [] as string[],
    targetSizes: [] as string[],
    seasonalStart: '',
    seasonalEnd: '',
    isSeasonal: false,
  });

  const categories = [
    'skolky',
    'upratovanie', 
    'jazykove_skoly',
    'gastronomia',
    'fitness_wellness',
    'firmy',
    'startup'
  ];

  const industries = [
    'Vzdelávanie',
    'Škôlky', 
    'Materinské školy',
    'Upratovanie',
    'Čisté služby',
    'Facility Management',
    'Jazykové školy',
    'E-learning',
    'Reštaurácie',
    'Hotely',
    'Kaviarne',
    'Gastronomické služby',
    'Fitness',
    'Wellness',
    'Športové centrá',
    'Jógové štúdiá',
    'Technológie',
    'IT',
    'Dizajn',
    'Potraviny'
  ];

  const sizes = ['small', 'medium', 'large'];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/enhanced-templates');
      console.log('Templates API response:', response.data);
      setTemplates(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError('Chyba pri načítavaní šablón: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/api/enhanced-templates', newTemplate);
      console.log('Create template response:', response.data);
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        subject: '',
        content: '',
        category: '',
        targetIndustries: [],
        targetSizes: [],
        seasonalStart: '',
        seasonalEnd: '',
        isSeasonal: false,
      });
      fetchTemplates();
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError('Chyba pri vytváraní šablóny: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleTemplate = async (id: string) => {
    try {
      await apiClient.post(`/api/enhanced-templates/${id}/toggle`);
      fetchTemplates();
    } catch (err: any) {
      console.error('Error toggling template:', err);
      setError('Chyba pri zmenení stavu šablóny: ' + (err.response?.data?.error || err.message));
    }
  };

  const editTemplate = (template: Template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category || '',
      targetIndustries: template.targetIndustries,
      targetSizes: template.targetSizes,
      seasonalStart: template.seasonalStart || '',
      seasonalEnd: template.seasonalEnd || '',
      isSeasonal: template.isSeasonal,
    });
    setShowEditForm(true);
  };

  const updateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    try {
      await apiClient.put(`/api/enhanced-templates/${editingTemplate.id}`, newTemplate);
      setShowEditForm(false);
      setEditingTemplate(null);
      setNewTemplate({
        name: '',
        subject: '',
        content: '',
        category: '',
        targetIndustries: [],
        targetSizes: [],
        seasonalStart: '',
        seasonalEnd: '',
        isSeasonal: false,
      });
      fetchTemplates();
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError('Chyba pri aktualizácii šablóny: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    if (checked) {
      setNewTemplate({
        ...newTemplate,
        targetIndustries: [...newTemplate.targetIndustries, industry]
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        targetIndustries: newTemplate.targetIndustries.filter(i => i !== industry)
      });
    }
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    if (checked) {
      setNewTemplate({
        ...newTemplate,
        targetSizes: [...newTemplate.targetSizes, size]
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        targetSizes: newTemplate.targetSizes.filter(s => s !== size)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítavam šablóny...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email Šablóny</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nová šablóna
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
        <p>Počet šablón: {templates.length}</p>
        {templates.length > 0 && (
          <div>
            <p>Prvá šablóna: {templates[0].name}</p>
            <p>Kategória: {templates[0].category}</p>
            <p>Aktívna: {templates[0].active ? 'Áno' : 'Nie'}</p>
          </div>
        )}
      </div>

      {/* Templates list */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Žiadne šablóny neboli nájdené. Vytvorte prvú šablónu.
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      template.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.active ? 'Aktívna' : 'Neaktívna'}
                    </span>
                    {template.isSeasonal && (
                      <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                        Sezónna
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2">{template.subject}</p>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Kategória: {template.category || 'N/A'}</p>
                    <p>Kampane: {template._count.campaigns}</p>
                    {template.targetIndustries.length > 0 && (
                      <p>Odvetvia: {template.targetIndustries.join(', ')}</p>
                    )}
                    {template.targetSizes.length > 0 && (
                      <p>Veľkosti: {template.targetSizes.join(', ')}</p>
                    )}
                    {template.isSeasonal && (
                      <p>Sezóna: {template.seasonalStart} - {template.seasonalEnd}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => editTemplate(template)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Upraviť
                  </button>
                  <button
                    onClick={() => toggleTemplate(template.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      template.active
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {template.active ? 'Deaktivovať' : 'Aktivovať'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create template modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nová šablóna</h2>
            <form onSubmit={createTemplate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Názov šablóny
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategória
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Vyberte kategóriu</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Predmet emailu
                </label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obsah emailu (HTML)
                </label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={8}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cieľové odvetvia
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {industries.map((industry) => (
                    <label key={industry} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={newTemplate.targetIndustries.includes(industry)}
                        onChange={(e) => handleIndustryChange(industry, e.target.checked)}
                        className="mr-2"
                      />
                      {industry}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cieľové veľkosti firiem
                </label>
                <div className="flex gap-4">
                  {sizes.map((size) => (
                    <label key={size} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.targetSizes.includes(size)}
                        onChange={(e) => handleSizeChange(size, e.target.checked)}
                        className="mr-2"
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTemplate.isSeasonal}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isSeasonal: e.target.checked })}
                    className="mr-2"
                  />
                  Sezónna šablóna
                </label>
              </div>

              {newTemplate.isSeasonal && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Začiatok sezóny (MM-DD)
                    </label>
                    <input
                      type="text"
                      value={newTemplate.seasonalStart}
                      onChange={(e) => setNewTemplate({ ...newTemplate, seasonalStart: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="08-01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Koniec sezóny (MM-DD)
                    </label>
                    <input
                      type="text"
                      value={newTemplate.seasonalEnd}
                      onChange={(e) => setNewTemplate({ ...newTemplate, seasonalEnd: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="06-30"
                    />
                  </div>
                </div>
              )}

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

      {/* Edit template modal */}
      {showEditForm && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upraviť šablónu</h2>
            <form onSubmit={updateTemplate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Názov šablóny
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategória
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Vyberte kategóriu</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Predmet emailu
                </label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obsah emailu (HTML)
                </label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={8}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cieľové odvetvia
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {industries.map((industry) => (
                    <label key={industry} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={newTemplate.targetIndustries.includes(industry)}
                        onChange={(e) => handleIndustryChange(industry, e.target.checked)}
                        className="mr-2"
                      />
                      {industry}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cieľové veľkosti firiem
                </label>
                <div className="flex gap-4">
                  {sizes.map((size) => (
                    <label key={size} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.targetSizes.includes(size)}
                        onChange={(e) => handleSizeChange(size, e.target.checked)}
                        className="mr-2"
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTemplate.isSeasonal}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isSeasonal: e.target.checked })}
                    className="mr-2"
                  />
                  Sezónna šablóna
                </label>
              </div>

              {newTemplate.isSeasonal && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Začiatok sezóny (MM-DD)
                    </label>
                    <input
                      type="text"
                      value={newTemplate.seasonalStart}
                      onChange={(e) => setNewTemplate({ ...newTemplate, seasonalStart: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="08-01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Koniec sezóny (MM-DD)
                    </label>
                    <input
                      type="text"
                      value={newTemplate.seasonalEnd}
                      onChange={(e) => setNewTemplate({ ...newTemplate, seasonalEnd: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="06-30"
                    />
                  </div>
                </div>
              )}

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
                    setEditingTemplate(null);
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

export default Templates;
