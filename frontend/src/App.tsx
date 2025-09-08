import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import PublicCalendar from './pages/PublicCalendar'
import Campaigns from './components/Campaigns'
import Templates from './components/Templates'
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
          <Route path="/templates" element={<Templates />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
