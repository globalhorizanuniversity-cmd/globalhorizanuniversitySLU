import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

const About = ({ user, setUser }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    'https://images.unsplash.com/photo-1590579491624-f98f36d4c763',
    'https://images.unsplash.com/photo-1576495199011-eb94736d05d6',
    'https://images.unsplash.com/photo-1614934273187-c83f8780fad9',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    'https://images.unsplash.com/photo-1721702754494-fdd7189f946c',
    'https://images.pexels.com/photos/9572338/pexels-photo-9572338.jpeg'
  ];

  const successStories = [
    {
      name: 'Dr. Sarah Chen',
      batch: '2010',
      achievement: 'Leading AI researcher at Stanford University',
      image: 'https://images.unsplash.com/photo-1590650046871-92c887180603'
    },
    {
      name: 'Michael Rodriguez',
      batch: '2012',
      achievement: 'Founder & CEO of Tech Innovations Inc.',
      image: 'https://images.unsplash.com/photo-1758520144420-3e5b22e9b9a4'
    },
    {
      name: 'Dr. Priya Sharma',
      batch: '2015',
      achievement: 'Award-winning healthcare innovator',
      image: 'https://images.unsplash.com/photo-1758599543132-ba9b306d715e'
    }
  ];

  return (
    <Layout user={user} setUser={setUser}>
      <div className="fade-in" data-testid="about-page">
        {/* Hero Section */}
        <div
          className="relative h-96 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1583373834259-46cc92173cb7)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90"></div>
          <div className="relative z-10 h-full flex items-center justify-center text-white text-center px-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="about-heading">About Global Horizon University</h1>
              <p className="text-base sm:text-lg max-w-2xl mx-auto">Building leaders, innovators, and changemakers since 1975</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
          {/* Our Legacy */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Our Legacy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-base text-gray-700 mb-4">
                  Founded in 1975, Global Horizon University has been at the forefront of higher education for over five decades. 
                  What began as a small institution with just 200 students has grown into a world-renowned university serving 
                  over 15,000 students from 80+ countries.
                </p>
                <p className="text-base text-gray-700 mb-4">
                  Our commitment to academic excellence, research innovation, and holistic development has produced over 50,000 
                  alumni who are making significant contributions across various fields globally. From Fortune 500 CEOs to 
                  Nobel laureates, our alumni network represents the pinnacle of achievement.
                </p>
                <p className="text-base text-gray-700">
                  Global Horizon University is consistently ranked among the top 100 universities worldwide, with particular 
                  strength in engineering, computer science, business, and medical sciences. Our faculty includes renowned 
                  researchers and industry experts who bring real-world experience into the classroom.
                </p>
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1590579491624-f98f36d4c763"
                  alt="Campus view"
                  className="rounded-2xl shadow-xl"
                />
              </div>
            </div>
          </section>

          {/* Current Courses */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Current Courses & Programs</h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-purple-900 mb-3">Undergraduate Programs</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Bachelor of Science in Computer Science</li>
                    <li>• Bachelor of Engineering (Multiple Specializations)</li>
                    <li>• Bachelor of Business Administration</li>
                    <li>• Bachelor of Arts in Economics</li>
                    <li>• Bachelor of Science in Data Science & AI</li>
                    <li>• Bachelor of Design (UX/UI, Product Design)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-900 mb-3">Graduate Programs</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Master of Business Administration (MBA)</li>
                    <li>• Master of Science in Computer Science</li>
                    <li>• Master of Engineering (Various Disciplines)</li>
                    <li>• Master of Public Health</li>
                    <li>• Executive MBA for Working Professionals</li>
                    <li>• Ph.D. Programs in 15+ Disciplines</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Campus Life */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Campus Life</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
                  alt="Campus life"
                  className="rounded-2xl shadow-xl"
                />
              </div>
              <div>
                <p className="text-base text-gray-700 mb-4">
                  Life at Global Horizon is vibrant and diverse. Our 200-acre campus in San Francisco features state-of-the-art 
                  facilities including modern classrooms, cutting-edge research laboratories, a 24/7 library with over 2 million 
                  volumes, Olympic-size swimming pool, fitness centers, and recreational facilities.
                </p>
                <p className="text-base text-gray-700 mb-4">
                  Students can choose from over 200 student organizations covering academics, sports, arts, culture, and social 
                  causes. Our campus hosts regular events including tech talks, cultural festivals, sports tournaments, and 
                  entrepreneurship competitions that foster community and personal growth.
                </p>
                <p className="text-base text-gray-700">
                  With on-campus housing for over 8,000 students, dining halls serving cuisines from around the world, and a 
                  dedicated student wellness center, we ensure our students have everything they need to thrive academically 
                  and personally.
                </p>
              </div>
            </div>
          </section>

          {/* Research & Innovation */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Research & Innovation</h2>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <img
                    src="https://images.unsplash.com/photo-1614934273187-c83f8780fad9"
                    alt="Research lab"
                    className="rounded-xl shadow-lg"
                  />
                </div>
                <div>
                  <p className="text-base text-gray-700 mb-4">
                    Global Horizon invests over $150 million annually in research and development. Our research centers focus on 
                    emerging technologies including artificial intelligence, renewable energy, biotechnology, and quantum computing.
                  </p>
                  <p className="text-base text-gray-700 mb-4">
                    We have partnerships with leading tech companies and research institutions worldwide, providing students with 
                    opportunities to work on groundbreaking projects. Our faculty have published over 5,000 research papers in 
                    top-tier journals and hold more than 200 patents.
                  </p>
                  <p className="text-base text-gray-700">
                    The university startup incubator has helped launch over 100 successful companies with a combined valuation 
                    exceeding $5 billion, making Global Horizon a hub for innovation and entrepreneurship.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Alumni Success Stories */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Alumni Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {successStories.map((story, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover-lift" data-testid={`success-story-${index}`}>
                  <div className="aspect-square overflow-hidden">
                    <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-1">{story.name}</h3>
                    <p className="text-sm text-purple-600 mb-3">Batch of {story.batch}</p>
                    <p className="text-sm text-gray-700">{story.achievement}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vision & Mission */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Vision & Mission</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-sm">
                  To be a globally recognized institution that nurtures innovative thinkers, ethical leaders, and responsible 
                  global citizens who drive positive change in society through excellence in education, research, and service.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-sm">
                  To provide world-class education that combines academic rigor with practical experience, foster groundbreaking 
                  research that addresses global challenges, and cultivate a diverse, inclusive community that prepares students 
                  for leadership in an interconnected world.
                </p>
              </div>
            </div>
          </section>

          {/* Image Gallery */}
          <section>
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Campus Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="image-gallery">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer hover-lift"
                  onClick={() => setSelectedImage(image)}
                  data-testid={`gallery-image-${index}`}
                >
                  <img src={image} alt={`Campus ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Image Enlarge Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl" data-testid="image-modal">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
            data-testid="close-image-modal"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} alt="Enlarged view" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default About;