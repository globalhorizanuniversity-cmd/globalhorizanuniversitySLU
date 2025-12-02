import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Users, Calendar, Heart } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = ({ user, setUser }) => {
  const [stats, setStats] = useState({ total_alumni: 0, upcoming_events: 0, recent_donations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const carouselImages = [
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
    'https://images.unsplash.com/photo-1590650046871-92c887180603',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    'https://images.unsplash.com/photo-1590579491624-f98f36d4c763',
    'https://images.unsplash.com/photo-1576495199011-eb94736d05d6'
  ];

  return (
    <Layout user={user} setUser={setUser}>
      <div className="p-6 lg:p-12 fade-in" data-testid="dashboard">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white mb-8 shadow-2xl">
          <h1 className="text-4xl font-bold mb-2" data-testid="welcome-message">
            Hi {user?.full_name}, Batch of {user?.passout_year}!
          </h1>
          <p className="text-base">Welcome back to the Global Horizon Alumni Network</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover-lift" data-testid="stat-alumni">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Alumni</p>
                <p className="text-3xl font-bold text-blue-900">{loading ? '...' : stats.total_alumni}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover-lift" data-testid="stat-events">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-3xl font-bold text-purple-900">{loading ? '...' : stats.upcoming_events}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover-lift" data-testid="stat-donations">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recent Donations</p>
                <p className="text-3xl font-bold text-orange-900">{loading ? '...' : stats.recent_donations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Carousel */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl" data-testid="image-carousel">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">Alumni Moments</h2>
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-video rounded-2xl overflow-hidden">
                    <img
                      src={image}
                      alt={`Alumni moment ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;