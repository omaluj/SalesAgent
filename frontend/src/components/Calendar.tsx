import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, Plus, Edit, Trash2, Check, X, Activity } from 'lucide-react'
import apiClient from '../config/axios'

interface TimeSlot {
  id: string
  date?: string // ISO date string (YYYY-MM-DD)
  day: string
  time: string
  available: boolean
  bookedBy?: string
  bookedAt?: string
  googleEventId?: string
}

interface CalendarProps {
  onClose: () => void
}

const Calendar: React.FC<CalendarProps> = ({ onClose }) => {
  console.log('Calendar component rendered');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(0) // 0 = prvý týždeň, 1 = druhý týždeň, atď.

  // Načítanie časových okien z API
  const loadTimeSlots = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/calendar/settings')
      const slots = response.data.data.timeSlots.map((slot: any) => ({
        id: slot.id || `${slot.day}-${slot.time}`,
        date: slot.date,
        day: slot.day,
        time: slot.time,
        available: slot.available,
        bookedBy: slot.bookedBy,
        bookedAt: slot.bookedAt,
        googleEventId: slot.googleEventId
      }))
      setTimeSlots(slots)
    } catch (error) {
      console.error('Error loading time slots:', error)
      // Fallback na default sloty
      generateDefaultTimeSlots()
    } finally {
      setIsLoading(false)
    }
  }

  // Generovanie default časových okien
  const generateDefaultTimeSlots = () => {
    const slots: TimeSlot[] = []
    const days = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok']
    const times = ['10:00', '11:00', '13:00', '14:00', '15:00']

    // Generovať sloty pre nasledujúcich 4 týždňov
    for (let week = 0; week < 4; week++) {
      days.forEach(day => {
        const dayNumber = getDayNumber(day)
        const slotDate = new Date()
        slotDate.setDate(slotDate.getDate() + (week * 7) + (dayNumber - slotDate.getDay() + 7) % 7)
        
        times.forEach(time => {
          const dateString = slotDate.toISOString().split('T')[0] // YYYY-MM-DD
          slots.push({
            id: `${dateString}-${time}`,
            date: dateString,
            day,
            time,
            available: true
          })
        })
      })
    }

    setTimeSlots(slots)
  }

  // Helper funkcia pre získanie čísla dňa
  const getDayNumber = (dayName: string): number => {
    const days: { [key: string]: number } = {
      'Nedeľa': 0,
      'Pondelok': 1,
      'Utorok': 2,
      'Streda': 3,
      'Štvrtok': 4,
      'Piatok': 5,
      'Sobota': 6
    }
    return days[dayName] ?? 0
  }

  // Funkcia pre získanie slotov pre aktuálny týždeň
  const getCurrentWeekSlots = () => {
    const startIndex = currentWeek * 25 // 25 slotov na týždeň
    const endIndex = startIndex + 25
    return timeSlots.slice(startIndex, endIndex)
  }

  // Funkcia pre získanie dátumu pre týždeň
  const getWeekDateRange = () => {
    const weekSlots = getCurrentWeekSlots()
    if (weekSlots.length === 0) return ''
    
    const firstSlot = weekSlots[0]
    const lastSlot = weekSlots[weekSlots.length - 1]
    
    if (firstSlot.date && lastSlot.date) {
      const firstDate = new Date(firstSlot.date).toLocaleDateString('sk-SK')
      const lastDate = new Date(lastSlot.date).toLocaleDateString('sk-SK')
      return `${firstDate} - ${lastDate}`
    }
    
    return ''
  }

  // Toggle dostupnosti slotu
  const toggleSlot = (slotId: string) => {
    console.log('Toggling slot:', slotId)
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, available: !slot.available }
          : slot
      )
    )
  }

  // Uloženie nastavení
  const saveSettings = async () => {
    try {
      await apiClient.post('/api/calendar/settings', { timeSlots })
      setIsEditing(false)
      // TODO: Show success message
    } catch (error) {
      console.error('Error saving calendar settings:', error)
      // TODO: Show error message
    }
  }

  // Zrušenie editácie
  const cancelEdit = () => {
    setIsEditing(false)
    loadTimeSlots() // Reset to saved data
  }



  // Synchronizácia s Google Calendar
  const handleSyncGoogle = async () => {
    try {
      await apiClient.post('/api/calendar/sync-google')
      await loadTimeSlots() // Reload data
      // TODO: Show success message
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error)
      // TODO: Show error message
    }
  }

  // Načítanie dát pri otvorení
  useEffect(() => {
    console.log('Calendar useEffect triggered');
    loadTimeSlots()
  }, [])

  console.log('Calendar render - isLoading:', isLoading, 'timeSlots:', timeSlots.length);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <CalendarIcon className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Kalendár - Časové okná</h2>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Upraviť
                </button>

                <button
                  onClick={handleSyncGoogle}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Sync Google
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveSettings}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Uložiť
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Zrušiť
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Načítavam časové okná...</span>
            </div>
          ) : (
            <>
              {/* Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Časové okná pre konzultácie</h3>
                <p className="text-blue-700 text-sm">
                  Nastavte dostupné časové okná pre konzultácie. Klienti si budú môcť vybrať z týchto termínov.
                </p>
              </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
              disabled={currentWeek === 0}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg flex items-center"
            >
              ← Predchádzajúci týždeň
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Týždeň {currentWeek + 1}
              </h3>
              <p className="text-sm text-gray-600">{getWeekDateRange()}</p>
            </div>
            
            <button
              onClick={() => setCurrentWeek(Math.min(3, currentWeek + 1))}
              disabled={currentWeek === 3}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg flex items-center"
            >
              Ďalší týždeň →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok'].map(day => (
              <div key={day} className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-center py-2 bg-gray-100 rounded-lg">
                  {day}
                </h3>
                
                {['10:00', '11:00', '13:00', '14:00', '15:00'].map(time => {
                  const weekSlots = getCurrentWeekSlots()
                  const slot = weekSlots.find(s => s.day === day && s.time === time)
                  const isAvailable = slot?.available ?? true
                  const slotDate = slot?.date ? new Date(slot.date).toLocaleDateString('sk-SK') : ''
                  
                  return (
                    <div
                      key={`${day}-${time}`}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        ${isAvailable 
                          ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                          : 'border-red-200 bg-red-50 hover:bg-red-100'
                        }
                        ${isEditing ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      `}
                      onClick={() => {
                        if (isEditing && slot) {
                          console.log('Clicking slot:', slot.id)
                          toggleSlot(slot.id)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="font-medium text-gray-900">{time}</span>
                        </div>
                        <div className={`
                          w-3 h-3 rounded-full
                          ${isAvailable ? 'bg-green-500' : 'bg-red-500'}
                        `} />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {isAvailable ? 'Dostupné' : 'Nedostupné'}
                        {slotDate && <div className="text-xs text-blue-600">{slotDate}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span>Dostupné</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <span>Nedostupné</span>
            </div>
          </div>

          {/* Settings */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Nastavenia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Dni:</p>
                <p className="font-medium">Pondelok - Piatok</p>
              </div>
              <div>
                <p className="text-gray-600">Časy:</p>
                <p className="font-medium">10:00, 11:00, 13:00, 14:00, 15:00</p>
              </div>
              <div>
                <p className="text-gray-600">Celkom slotov:</p>
                <p className="font-medium">{timeSlots.length} (4 týždne × 5 dní × 5 časov)</p>
              </div>
              <div>
                <p className="text-gray-600">Dostupné sloty:</p>
                <p className="font-medium text-green-600">
                  {timeSlots.filter(s => s.available).length} z {timeSlots.length}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Aktuálny týždeň:</p>
                <p className="font-medium">{currentWeek + 1} z 4</p>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Calendar;
