import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, Building, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface TimeSlot {
  id: string;
  date: string;
  day: string;
  time: string;
  available: boolean;
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const PublicCalendar: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Načítať dostupné sloty
  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/public/calendar/slots');
      const data = await response.json();
      
      if (data.success) {
        setTimeSlots(data.data.slots);
      } else {
        console.error('Chyba pri načítaní slotov:', data.error);
      }
    } catch (error) {
      console.error('Chyba pri načítaní slotov:', error);
    } finally {
      setLoading(false);
    }
  };

  // Získať sloty pre aktuálny týždeň
  const getCurrentWeekSlots = () => {
    const startIndex = currentWeek * 25; // 25 slotov na týždeň
    const endIndex = startIndex + 25;
    return timeSlots.slice(startIndex, endIndex);
  };

  // Získať rozsah dát pre aktuálny týždeň
  const getWeekDateRange = () => {
    const weekSlots = getCurrentWeekSlots();
    if (weekSlots.length === 0) return '';
    
    const firstSlot = weekSlots[0];
    const lastSlot = weekSlots[weekSlots.length - 1];
    
    const firstDate = new Date(firstSlot.date).toLocaleDateString('sk-SK');
    const lastDate = new Date(lastSlot.date).toLocaleDateString('sk-SK');
    
    return `${firstDate} - ${lastDate}`;
  };

  // Rezervovať slot
  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      const response = await fetch('http://localhost:3001/api/public/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          ...bookingForm
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setBookingSuccess(true);
        setShowBookingModal(false);
        // Obnoviť sloty
        await loadAvailableSlots();
      } else {
        alert(`Chyba: ${data.error}`);
      }
    } catch (error) {
      console.error('Chyba pri rezervácii:', error);
      alert('Chyba pri rezervácii termínu');
    } finally {
      setBookingLoading(false);
    }
  };

  // Zmeniť týždeň
  const changeWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    } else if (direction === 'next' && currentWeek < 3) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítavam dostupné termíny...</p>
        </div>
      </div>
    );
  }

  const currentWeekSlots = getCurrentWeekSlots();
  const availableCount = currentWeekSlots.filter(slot => slot.available).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rezervácia konzultácie
            </h1>
            <p className="text-lg text-gray-600">
              Vyberte si dostupný termín pre bezplatnú konzultáciu
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeWeek('prev')}
            disabled={currentWeek === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            ← Predchádzajúci týždeň
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Týždeň {currentWeek + 1}
            </h2>
            <p className="text-gray-600">{getWeekDateRange()}</p>
            <p className="text-sm text-gray-500">
              Dostupných termínov: {availableCount} z {currentWeekSlots.length}
            </p>
          </div>
          
          <button
            onClick={() => changeWeek('next')}
            disabled={currentWeek === 3}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Ďalší týždeň →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-5 gap-4 p-6">
            {['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok'].map((day) => (
              <div key={day} className="text-center">
                <h3 className="font-semibold text-gray-900 mb-4">{day}</h3>
                <div className="space-y-2">
                  {currentWeekSlots
                    .filter(slot => slot.day === day)
                    .map((slot) => {
                      const slotDate = new Date(slot.date).toLocaleDateString('sk-SK');
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            if (slot.available) {
                              setSelectedSlot(slot);
                              setShowBookingModal(true);
                            }
                          }}
                          disabled={!slot.available}
                          className={`w-full p-3 rounded-lg border text-sm transition-colors ${
                            slot.available
                              ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 cursor-pointer'
                              : 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-medium">{slot.time}</div>
                          <div className="text-xs mt-1">{slotDate}</div>
                          <div className="text-xs mt-1">
                            {slot.available ? 'Dostupné' : 'Obsadené'}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Informácie o konzultácii
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Dĺžka: 30 minút</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Online alebo osobne</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Bezplatná konzultácia</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>Možnosť pokračovania spolupráce</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              Rezervácia termínu
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Termín:</strong> {selectedSlot.day}, {new Date(selectedSlot.date).toLocaleDateString('sk-SK')} o {selectedSlot.time}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleBookSlot(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meno a priezvisko *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vaše meno"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="vas@email.sk"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefón
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+421 xxx xxx xxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spoločnosť
                  </label>
                  <input
                    type="text"
                    value={bookingForm.company}
                    onChange={(e) => setBookingForm({...bookingForm, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Názov spoločnosti"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poznámka
                  </label>
                  <textarea
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Čo vás zaujíma alebo aké máte otázky?"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {bookingLoading ? 'Rezervujem...' : 'Rezervovať'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Rezervácia úspešná!
            </h3>
            <p className="text-gray-600 mb-6">
              Váš termín bol úspešne rezervovaný. Očakávajte email s potvrdením a ďalšími informáciami.
            </p>
            <button
              onClick={() => setBookingSuccess(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCalendar;
