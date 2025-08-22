import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe,
  ArrowRight,
  Play,
  Star
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      title: "Premium Betting Experience",
      description: "Enjoy the most competitive odds and seamless betting experience across all major sports."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Agent Network",
      description: "Join our network of agents and earn commissions while helping players succeed."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Live Betting",
      description: "Place bets in real-time with live odds updates and instant results."
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-500" />,
      title: "Secure & Reliable",
      description: "Your funds and personal information are protected with bank-level security."
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-500" />,
      title: "Instant Payouts",
      description: "Get your winnings instantly with our lightning-fast payment system."
    },
    {
      icon: <Globe className="w-8 h-8 text-indigo-500" />,
      title: "Global Coverage",
      description: "Access sports and events from around the world, 24/7."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "100+", label: "Sports & Events" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Professional Bettor",
      content: "The best sportsbook I've ever used. Great odds and amazing live betting features!",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Sports Agent",
      content: "Excellent platform for managing players and earning commissions. Highly recommended!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Casual Player",
      content: "User-friendly interface and quick payouts. Perfect for both beginners and pros.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-white">Sportsbook</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            The Future of
            <span className="text-yellow-500 block">Sports Betting</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Experience the most advanced sportsbook platform with real-time odds, 
            live betting, and a comprehensive agent network. Join thousands of 
            satisfied users worldwide.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              to="/register" 
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Betting Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-gray-900 transition-all transform hover:scale-105 flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose Sportsbook?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We've built the most comprehensive and user-friendly sports betting 
              platform with features that set us apart from the competition.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-700 p-8 rounded-xl hover:bg-gray-600 transition-all transform hover:scale-105"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-300">
              Don't just take our word for it - hear from our satisfied users
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-gray-800 p-6 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-yellow-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Start?
            </h2>
            <p className="text-xl text-gray-800 mb-8">
              Join thousands of users and start your sports betting journey today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
              >
                Create Account
              </Link>
              <Link 
                to="/login" 
                className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-900 hover:text-white transition-all transform hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold text-white">Sportsbook</span>
              </div>
              <p className="text-gray-400">
                The most advanced sports betting platform with real-time odds and live betting.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/sports" className="hover:text-white transition-colors">Sports</Link></li>
                <li><Link to="/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link to="/betting" className="hover:text-white transition-colors">Betting</Link></li>
                <li><Link to="/live" className="hover:text-white transition-colors">Live Betting</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/responsible-gambling" className="hover:text-white transition-colors">Responsible Gambling</Link></li>
                <li><Link to="/licenses" className="hover:text-white transition-colors">Licenses</Link></li>
                <li><Link to="/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sportsbook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 