import React from 'react';
import { Heart, Mail, Phone, MapPin, ExternalLink, Github, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Search Items', path: '/search' },
    { name: 'Post Lost Item', path: '/post-lost' },
    { name: 'Post Found Item', path: '/post-found' },
    { name: 'Community', path: '/community' },
  ];

  const supportLinks = [
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'FAQ', path: '/faq' },
  ];

  const teamMembers = [
    {
      name: 'Fahmida Afrin',
      id: '0802410105101015',
      role: 'Lead Developer',
    },
    {
      name: 'Kazi Saiyatan Haque Sadia',
      id: '0802410105101027',
      role: 'Frontend Developer',
    },
    {
      name: 'Meftahul Jannat',
      id: '0802410105101024',
      role: 'Backend Developer',
    },
  ];

  return (
    <footer className="bg-white border-t border-border">
      <div className="container mx-auto px-4 py-12 text-black">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-black">Lost & Found</span>
            </div>
            <p className="text-black/70 text-sm leading-relaxed">
              Connecting communities to reunite people with their lost belongings. 
              Every item has a story, and we help complete that story.
            </p>
            <div className="flex items-center gap-2 text-sm text-black/60">
              <MapPin className="h-4 w-4" />
              <span>Serving communities worldwide</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-black">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-black/70 hover:text-black hover:underline text-sm transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-black">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-black/70 hover:text-black hover:underline text-sm transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-black/60">
                <Mail className="h-4 w-4" />
                <span>support@lostandfound.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Development Team */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-black">Development Team</h3>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="space-y-1">
                  <div className="text-black font-medium text-sm">{member.name}</div>
                  <div className="text-black/60 text-xs">{member.role}</div>
                  <div className="text-black/50 text-xs font-mono">{member.id}</div>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-black/60 text-xs">
                Built with ❤️ by our amazing team
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-black/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-black/60 text-sm">
              © {new Date().getFullYear()} Lost & Found Platform. All rights reserved.
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-black/60 hover:text-black transition-colors">
                <Github className="h-5 w-5" />
              </button>
              <button className="text-black/60 hover:text-black transition-colors">
                <Linkedin className="h-5 w-5" />
              </button>
            <div className="text-black/60 text-sm">
                Made with React & Supabase
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};