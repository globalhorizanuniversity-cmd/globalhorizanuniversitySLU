import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Edit, Calendar, Heart, MessageCircle, MapPin, Building, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = ({ user, setUser }) => {
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    current_location: '',
    current_company: '',
    domain: '',
    phone: '',
    profile_picture: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      setFormData({
        full_name: response.data.user.full_name,
        current_location: response.data.user.current_location,
        current_company: response.data.user.current_company,
        domain: response.data.user.domain,
        phone: response.data.user.phone,
        profile_picture: response.data.user.profile_picture
      });
    } catch (error) {
      toast.error('Failed to load profile');
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phonePattern.test(formData.phone)) {
      toast.error('Phone must be in format (XXX) XXX-XXXX');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BACKEND_URL}/api/user/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      setEditMode(false);
      fetchProfile();
      
      // Update local user state
      const updatedUser = { ...user, ...response.data.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Layout user={user} setUser={setUser}>
        <div className="p-12 text-center">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user} setUser={setUser}>
      <div className="p-6 lg:p-12 fade-in" data-testid="profile-page">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900" data-testid="profile-heading">My Profile</h1>
            <Button
              onClick={() => setEditMode(!editMode)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="edit-profile-button"
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={profileData.user.profile_picture}
                alt={profileData.user.full_name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                data-testid="profile-picture"
              />
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{profileData.user.full_name}</h2>
                <p className="text-base text-blue-100 mb-2">{profileData.user.email}</p>
                <p className="text-sm">Batch of {profileData.user.passout_year} • Global Horizon University</p>
              </div>
            </div>
          </div>

          {editMode ? (
            /* Edit Form */
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Edit Information</h2>
              <form onSubmit={handleUpdate} className="space-y-6" data-testid="edit-profile-form">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    data-testid="edit-name-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="current_location">Current Location</Label>
                    <Input
                      id="current_location"
                      value={formData.current_location}
                      onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                      data-testid="edit-location-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      data-testid="edit-phone-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="current_company">Current Company</Label>
                    <Input
                      id="current_company"
                      value={formData.current_company}
                      onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                      data-testid="edit-company-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="domain">Domain/Industry</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      data-testid="edit-domain-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="profile_picture">Profile Picture URL</Label>
                  <Input
                    id="profile_picture"
                    value={formData.profile_picture}
                    onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                    data-testid="edit-picture-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6"
                  data-testid="save-profile-button"
                >
                  Save Changes
                </Button>
              </form>
            </div>
          ) : (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Location</h3>
                </div>
                <p className="text-sm text-gray-700">{profileData.user.current_location}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Company</h3>
                </div>
                <p className="text-sm text-gray-700">{profileData.user.current_company}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Domain</h3>
                </div>
                <p className="text-sm text-gray-700">{profileData.user.domain}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                </div>
                <p className="text-sm text-gray-700">{profileData.user.phone}</p>
              </Card>
            </div>
          )}

          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center" data-testid="registered-events-count">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-blue-600" />
              <p className="text-3xl font-bold text-blue-900">{profileData.registered_events.length}</p>
              <p className="text-sm text-gray-600">Registered Events</p>
            </Card>

            <Card className="p-6 text-center" data-testid="donations-count">
              <Heart className="w-10 h-10 mx-auto mb-3 text-red-600" />
              <p className="text-3xl font-bold text-red-900">{profileData.donations.length}</p>
              <p className="text-sm text-gray-600">Donations Made</p>
            </Card>

            <Card className="p-6 text-center" data-testid="messages-count">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-green-600" />
              <p className="text-3xl font-bold text-green-900">{profileData.message_count}</p>
              <p className="text-sm text-gray-600">Messages</p>
            </Card>
          </div>

          {/* Registered Events */}
          {profileData.registered_events.length > 0 && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Registered Events</h2>
              <div className="space-y-4">
                {profileData.registered_events.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl" data-testid={`registered-event-${event.id}`}>
                    <img src={event.image} alt={event.title} className="w-20 h-20 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donation History */}
          {profileData.donations.length > 0 && (
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Donation History</h2>
              <div className="space-y-4">
                {profileData.donations.map((donation) => (
                  <div key={donation.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl" data-testid={`donation-${donation.id}`}>
                    <div>
                      <h3 className="font-semibold text-gray-900">{donation.purpose}</h3>
                      <p className="text-sm text-gray-600">{new Date(donation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">${donation.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;