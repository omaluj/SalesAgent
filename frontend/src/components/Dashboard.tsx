import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import apiClient from '../config/axios'
import { 
  Mail, 
  Building2, 
  Calendar, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp
} from 'lucide-react'
import CalendarModal from './Calendar.js'
import TestModal from './TestModal.js'

interface DashboardData {
  emailMetrics: {
    total: number
    sent: number
    failed: number
    pending: number
  }
  companyMetrics: {
    total: number
    active: number
    contacted: number
    interested: number
  }
  calendarMetrics: {
    total: number
    scheduled: number
    completed: number
    cancelled: number
  }
  recentActivity: {
    emails: any[]
    companies: any[]
  }
  activeCampaigns: any[]
  recentCampaignEmails: any[]
  systemStatus: {
    oauth: boolean
    queue: {
      isProcessing: boolean
      pendingCount: number
    }
    lastPipelineRun: string
  }
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get('/api/dashboard/overview')
  return response.data.data
}

const Dashboard: React.FC = () => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showEmailTest, setShowEmailTest] = useState(false)
  const [emailTestData, setEmailTestData] = useState({
    to: '',
    subject: '',
    content: '',
    useMock: true,
    emailService: 'mock'
  })
  const [emailTestLoading, setEmailTestLoading] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<any>(null)
  const { data, isLoading, error } = useQuery<DashboardData>('dashboard', fetchDashboardData, {
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const sendTestEmail = async () => {
    try {
      setEmailTestLoading(true)
      setEmailTestResult(null)
      
      const response = await apiClient.post('/api/dashboard/test-email', emailTestData)
      
      if (response.data.success) {
        setEmailTestResult({
          success: true,
          message: response.data.message,
          data: response.data.data
        })
      } else {
        setEmailTestResult({
          success: false,
          error: response.data.error
        })
      }
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        error: err.response?.data?.error || err.message || 'Chyba pri odosielaní emailu'
      })
    } finally {
      setEmailTestLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chyba pri načítaní</h2>
          <p className="text-gray-600">Nepodarilo sa načítať dáta z API</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Biz-Agent Dashboard</h1>
        <p className="text-gray-600">Automatizovaný obchodný agent pre Domelia.sk</p>
        
        {/* Navigation */}
        <div className="mt-4 flex gap-4">
          <Link 
            to="/campaigns" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📧 Email Kampane
          </Link>
          <Link 
            to="/templates" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            📝 Email Šablóny
          </Link>
          <Link 
            to="/calendar" 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            📅 Kalendár
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Email Metrics */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Odoslané emaily</p>
              <p className="text-2xl font-bold text-gray-900">{data.emailMetrics.sent}</p>
            </div>
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Celkom: {data.emailMetrics.total} | Zlyhaní: {data.emailMetrics.failed}
          </div>
        </div>

        {/* Company Metrics */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kontaktované firmy</p>
              <p className="text-2xl font-bold text-gray-900">{data.companyMetrics.contacted}</p>
            </div>
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Celkom: {data.companyMetrics.total} | Záujem: {data.companyMetrics.interested}
          </div>
        </div>

        {/* Calendar Metrics */}
        <div className="metric-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          console.log('Calendar clicked, setting showCalendar to true');
          setShowCalendar(true);
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kalendár eventy</p>
              <p className="text-2xl font-bold text-gray-900">{data.calendarMetrics.scheduled}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Celkom: {data.calendarMetrics.total} | Dokončené: {data.calendarMetrics.completed}
          </div>
          <div className="mt-2 text-xs text-purple-600 font-medium">
            Kliknite pre nastavenie časových okien →
          </div>
        </div>

        {/* Test Email Button */}
        <div className="metric-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          console.log('Test email clicked');
          setShowEmailTest(true);
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Email</p>
              <p className="text-2xl font-bold text-gray-900">📧</p>
            </div>
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Kliknite pre test emailu
          </div>
        </div>

        {/* System Status */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Systém status</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.systemStatus.oauth ? 'Aktívny' : 'Neaktívny'}
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Queue: {data.systemStatus.queue.isProcessing ? 'Spracováva' : 'Neaktívna'}
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Aktívne kampane</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.activeCampaigns.map((campaign) => (
            <div key={campaign.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                      {campaign.template.name}
                    </span>
                    <span>{campaign.campaignCompanies.length} firiem</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Začiatok:</span>
                  <span className="font-medium">{new Date(campaign.startDate).toLocaleDateString('sk-SK')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Koniec:</span>
                  <span className="font-medium">{new Date(campaign.endDate).toLocaleDateString('sk-SK')}</span>
                </div>
              </div>
              
              {campaign.campaignCompanies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Posledné odoslané:</h4>
                  <div className="space-y-2">
                    {campaign.campaignCompanies.slice(0, 2).map((cc) => (
                      <div key={cc.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{cc.company.name}</span>
                        <span className="text-gray-500">
                          {cc.sentAt ? new Date(cc.sentAt).toLocaleDateString('sk-SK') : 'Naplánované'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaign Emails */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Posledné odoslané emaily z kampaní
          </h3>
          <div className="space-y-3">
            {data.recentCampaignEmails.slice(0, 5).map((email) => (
              <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{email.campaign.name}</p>
                  <p className="text-xs text-gray-500">{email.company.name}</p>
                  <p className="text-xs text-blue-600">{email.campaign.template.name}</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-gray-500">
                    {email.sentAt ? new Date(email.sentAt).toLocaleDateString('sk-SK') : 'Naplánované'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Posledné firmy
          </h3>
          <div className="space-y-3">
            {data.recentActivity.companies.slice(0, 5).map((company) => (
              <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{company.name}</p>
                  <p className="text-xs text-gray-500">{company.industry} • {company.size}</p>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-xs text-gray-500">{company.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Systémové informácie</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">OAuth Status:</p>
            <p className="font-medium">{data.systemStatus.oauth ? '✅ Aktívny' : '❌ Neaktívny'}</p>
          </div>
          <div>
            <p className="text-gray-600">Email Queue:</p>
            <p className="font-medium">
              {data.systemStatus.queue.isProcessing ? '🔄 Spracováva' : '⏸️ Neaktívna'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Posledný pipeline:</p>
            <p className="font-medium">
              {new Date(data.systemStatus.lastPipelineRun).toLocaleString('sk-SK')}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <>
          {console.log('Rendering CalendarModal, showCalendar:', showCalendar)}
          <CalendarModal onClose={() => {
            console.log('CalendarModal onClose called');
            setShowCalendar(false);
          }} />
        </>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <TestModal onClose={() => {
          console.log('TestModal onClose called');
          setShowTestModal(false);
        }} />
      )}

      {/* Email Test Modal */}
      {showEmailTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Test Email</h2>
              <button
                onClick={() => setShowEmailTest(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email adresa
                </label>
                <input
                  type="email"
                  value={emailTestData.to}
                  onChange={(e) => setEmailTestData({...emailTestData, to: e.target.value})}
                  placeholder="test@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Predmet
                </label>
                <input
                  type="text"
                  value={emailTestData.subject}
                  onChange={(e) => setEmailTestData({...emailTestData, subject: e.target.value})}
                  placeholder="Test email z Domelia.sk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obsah (HTML)
                </label>
                <textarea
                  value={emailTestData.content}
                  onChange={(e) => setEmailTestData({...emailTestData, content: e.target.value})}
                  placeholder="<h1>Test email</h1><p>Toto je test email z Domelia.sk</p>"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emailová služba
                </label>
                <select
                  value={emailTestData.emailService}
                  onChange={(e) => setEmailTestData({...emailTestData, emailService: e.target.value, useMock: e.target.value === 'mock'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mock">Mock služba (testovací režim)</option>
                  <option value="smtp">SMTP (MailHog - lokálne)</option>
                  <option value="gmail">Gmail</option>
                  <option value="mailjet">Mailjet</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={sendTestEmail}
                  disabled={emailTestLoading || !emailTestData.to || !emailTestData.subject || !emailTestData.content}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {emailTestLoading ? 'Odosielam...' : 'Odoslať test email'}
                </button>
                <button
                  onClick={() => setShowEmailTest(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Zrušiť
                </button>
              </div>

              {emailTestResult && (
                <div className={`p-4 rounded-lg ${
                  emailTestResult.success 
                    ? 'bg-green-100 border border-green-300 text-green-800' 
                    : 'bg-red-100 border border-red-300 text-red-800'
                }`}>
                  <h4 className="font-medium mb-2">
                    {emailTestResult.success ? '✅ Úspech' : '❌ Chyba'}
                  </h4>
                  <p className="text-sm">
                    {emailTestResult.success ? emailTestResult.message : emailTestResult.error}
                  </p>
                  {emailTestResult.success && emailTestResult.data && (
                    <div className="mt-2 text-xs">
                      <p>Message ID: {emailTestResult.data.messageId}</p>
                      <p>Služba: {emailTestResult.data.emailService}</p>
                      <p>Typ: {emailTestResult.data.useMock ? 'Mock' : 'Skutočný'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
