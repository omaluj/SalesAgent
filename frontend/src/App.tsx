import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import PublicCalendar from './pages/PublicCalendar'
import Campaigns from './components/Campaigns'
import Templates from './components/Templates'
import ContactTargeting from './components/ContactTargeting'
import CampaignWithTargeting from './components/CampaignWithTargeting'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<PublicCalendar />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns-targeting" element={<CampaignWithTargeting />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/contacts" element={<ContactTargeting />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
