import React from 'react';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-[#F0ECC7] bg-[#FEF8E0] shadow-[0_-8px_20px_rgba(195,175,140,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl neo-btn-primary flex items-center justify-center text-white">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-stone-800 text-sm">
              SkillSwap Platform
            </span>
            <span className="text-stone-500 text-xs font-medium">| Peer Knowledge Exchange</span>
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold text-stone-600">
            <div className="flex items-center gap-1.5 text-[#166534] bg-[#AFDFB5]/30 border border-[#AFDFB5]/60 neo-card-sm px-3 py-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
              <span>System Operational</span>
            </div>
            <Link to="/browse" className="hover:text-[#E05504] transition-colors">
              Browse Skills
            </Link>
            <Link to="/swaps" className="hover:text-[#E05504] transition-colors">
              Exchange Hub
            </Link>
          </div>

          <div className="text-xs text-stone-400 font-medium">
            &copy; {new Date().getFullYear()} SkillSwap Inc. Modern Neomorphic Edition.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
