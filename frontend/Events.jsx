import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Events = ({ user, setUser }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    attend_dinner: true
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleRegister = (event) => {
    setSelectedEvent(event);
    setRegistrationOpen(true);
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    
    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phonePattern.test(formData.phone)) {
      toast.error('Phone must be in format (XXX) XXX-XXXX');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/events/${selectedEvent.id}/register`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      setRegistrationOpen(false);
      setFormData({ ...formData, phone: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Layout user={user} setUser={setUser}>
      <div className="p-6 lg:p-12 fade-in" data-testid="events-page">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2" data-testid="events-heading">Upcoming Events</h1>
          <p className="text-base text-gray-600">Join us for exciting alumni gatherings and networking opportunities</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover-lift"
                data-testid={`event-${event.id}`}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">{event.title}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">{event.description}</p>
                  
                  {event.has_registration ? (
                    <Button
                      onClick={() => handleRegister(event)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid={`register-button-${event.id}`}
                    >
                      Register
                    </Button>
                  ) : (
                    <div className="text-center text-sm text-gray-500 italic">No registration required</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
        <DialogContent data-testid="registration-modal">
          <DialogHeader>
            <DialogTitle>Event Registration</DialogTitle>
            <DialogDescription>Register for {selectedEvent?.title}</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitRegistration} className="space-y-4">
            <div>
              <Label htmlFor="reg-name">Name</Label>
              <Input
                id="reg-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="registration-name-input"
              />
            </div>

            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="registration-email-input"
              />
            </div>

            <div>
              <Label htmlFor="reg-phone">Phone (US Format)</Label>
              <Input
                id="reg-phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                required
                data-testid="registration-phone-input"
              />
            </div>

            <div>
              <Label>Will you attend dinner?</Label>
              <RadioGroup
                value={formData.attend_dinner.toString()}
                onValueChange={(value) => setFormData({ ...formData, attend_dinner: value === 'true' })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="dinner-yes" data-testid="dinner-yes" />
                  <Label htmlFor="dinner-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="dinner-no" data-testid="dinner-no" />
                  <Label htmlFor="dinner-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="registration-submit-button"
            >
              Submit Registration
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Events;