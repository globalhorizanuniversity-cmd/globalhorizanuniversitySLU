import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Register = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    passout_year: '',
    current_location: '',
    current_company: '',
    domain: '',
    phone: '',
    profile_picture: ''
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phonePattern.test(formData.phone)) {
      toast.error('Phone must be in format (XXX) XXX-XXXX');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      submitData.passout_year = parseInt(submitData.passout_year);
      
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, submitData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      toast.success(response.data.message);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const years = [];
  for (let year = 2025; year >= 1990; year--) {
    years.push(year);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2" data-testid="register-heading">Join Our Alumni Network</h1>
            <p className="text-base text-gray-600">Connect with fellow Global Horizon alumni</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="mt-1"
                data-testid="full-name-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                  data-testid="email-input"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone (US Format) *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  required
                  className="mt-1"
                  data-testid="phone-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1"
                  data-testid="password-input"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="mt-1"
                  data-testid="confirm-password-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value="Global Horizon University"
                disabled
                className="mt-1 bg-gray-100"
                data-testid="university-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="passout_year">Passout Year *</Label>
                <Select value={formData.passout_year} onValueChange={(value) => setFormData({ ...formData, passout_year: value })}>
                  <SelectTrigger className="mt-1" data-testid="passout-year-select">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="current_location">Current Location *</Label>
                <Input
                  id="current_location"
                  value={formData.current_location}
                  onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                  required
                  className="mt-1"
                  data-testid="location-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="current_company">Current Company *</Label>
                <Input
                  id="current_company"
                  value={formData.current_company}
                  onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                  required
                  className="mt-1"
                  data-testid="company-input"
                />
              </div>

              <div>
                <Label htmlFor="domain">Domain/Industry *</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  required
                  className="mt-1"
                  data-testid="domain-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="profile_picture">Profile Picture URL (Optional)</Label>
              <Input
                id="profile_picture"
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="mt-1"
                data-testid="profile-picture-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg rounded-full font-semibold shadow-lg"
              data-testid="register-submit-button"
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold" data-testid="login-link">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;