import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft, Sparkles, User } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="neo-card max-w-md w-full p-8 text-center space-y-6">
        {/* Soft 404 Badge */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl neo-card text-[#E05504] mb-2">
          <span className="text-4xl font-extrabold tracking-tight font-mono">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-800">
            Page Not Found
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            The page you are looking for might have been moved, renamed, or doesn't exist.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
          <Link
            to="/browse"
            className="p-3 rounded-xl neo-card-sm flex items-center gap-3 group hover:text-[#E05504] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F0ECC7]/70 text-[#E05504] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-stone-700 group-hover:text-[#E05504]">Browse Skills</div>
              <div className="text-[11px] text-stone-400">Discover offered and wanted skills</div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="p-3 rounded-xl neo-card-sm flex items-center gap-3 group hover:text-[#E05504] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#AFDFB5]/40 text-[#166534] flex items-center justify-center group-hover:scale-105 transition-transform">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-stone-700 group-hover:text-[#E05504]">My Profile</div>
              <div className="text-[11px] text-stone-400">View your skills and activity trail</div>
            </div>
          </Link>
        </div>

        {/* Home Button */}
        <div className="pt-2">
          <Link
            to="/"
            className="neo-btn-primary w-full py-2.5 rounded-xl font-medium inline-flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
