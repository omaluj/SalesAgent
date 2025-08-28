import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
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
  const response = await axios.get('/api/dashboard/overview')
  return response.data.data
}

const Dashboard: React.FC = () => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const { data, isLoading, error } = useQuery<DashboardData>('dashboard', fetchDashboardData, {
    refetchInterval: 30000, // Refresh every 30 seconds
  })

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

        {/* Test Modal Button */}
        <div className="metric-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          console.log('Test modal clicked');
          setShowTestModal(true);
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Modal</p>
              <p className="text-2xl font-bold text-gray-900">Test</p>
            </div>
            <Activity className="h-8 w-8 text-red-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Kliknite pre test modalu
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Emails */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Posledné emaily
          </h3>
          <div className="space-y-3">
            {data.recentActivity.emails.slice(0, 5).map((email) => (
              <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{email.subject}</p>
                  <p className="text-xs text-gray-500">{email.to}</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-gray-500">{email.status}</span>
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
    </div>
  )
}

export default Dashboard
