import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Heart } from 'lucide-react';

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80"></div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl fade-in" data-testid="hero-section">
          <div className="mb-8">
            <img
              src="https://images.unsplash.com/photo-1583373834259-46cc92173cb7"
              alt="Global Horizon University"
              className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-2xl"
              data-testid="university-logo"
            />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" data-testid="main-heading">
            Global Horizon University
            <br />
            <span className="text-orange-400">Alumni Network</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-lg mb-12 max-w-2xl mx-auto" data-testid="tagline">
            Connect. Celebrate. Contribute.
            <br />
            Join thousands of alumni building a stronger future together
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-900 hover:bg-blue-50 px-12 py-6 text-lg rounded-full font-semibold shadow-2xl button-pulse"
              data-testid="login-button"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-orange-500 text-white hover:bg-orange-600 px-12 py-6 text-lg rounded-full font-semibold shadow-2xl button-pulse"
              data-testid="register-button"
            >
              Register Now
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center" data-testid="feature-connect">
              <Users className="w-12 h-12 mx-auto mb-3 text-orange-400" />
              <h3 className="font-semibold text-lg">Connect</h3>
              <p className="text-sm">Network with alumni worldwide</p>
            </div>
            <div className="text-center" data-testid="feature-events">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-orange-400" />
              <h3 className="font-semibold text-lg">Events</h3>
              <p className="text-sm">Join exclusive alumni gatherings</p>
            </div>
            <div className="text-center" data-testid="feature-contribute">
              <Heart className="w-12 h-12 mx-auto mb-3 text-orange-400" />
              <h3 className="font-semibold text-lg">Contribute</h3>
              <p className="text-sm">Give back to the community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">&copy; 2025 Global Horizon University. All rights reserved.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-orange-400 transition-colors">Facebook</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-orange-400 transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;