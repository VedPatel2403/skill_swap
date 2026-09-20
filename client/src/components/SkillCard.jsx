import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';

const SkillCard = ({ skill, onRequestSwap }) => {
  const { user: currentUser } = useAuth();
  const owner = skill.user || {};
  const isOwner = currentUser?.id === owner.id;

  return (
    <div className="neo-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5">
            <StatusBadge status={skill.type} />
            <span className="text-xs px-2.5 py-0.5 rounded-full neo-card-sm text-slate-700 font-semibold">
              {skill.category}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 neo-inset px-2.5 py-0.5 rounded-md">
            {skill.proficiency}
          </span>
        </div>

        {/* Skill Title & Description */}
        <h3 className="text-base font-bold text-stone-900 mb-2 leading-snug group-hover:text-[#E05504] transition-colors">
          {skill.title}
        </h3>
        <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed font-normal">
          {skill.description}
        </p>
      </div>

      <div>
        {/* User Info Bar */}
        <div className="pt-3 border-t border-[#F0ECC7] flex items-center justify-between gap-2 mb-3">
          <Link
            to={`/user/${owner.id}`}
            className="flex items-center gap-2.5 group/user min-w-0"
          >
            <img
              src={owner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.name}`}
              alt={owner.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-800 group-hover/user:text-[#E05504] transition-colors block truncate">
                {owner.name}
              </span>
              {owner.location && (
                <span className="text-[11px] text-stone-400 flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-stone-400" />
                  {owner.location}
                </span>
              )}
            </div>
          </Link>

          {/* User Rating */}
          <div className="flex items-center gap-1 text-xs neo-card-sm px-2 py-1 flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-[#FAA121] text-[#FAA121]" />
            <span className="font-bold text-stone-800">{owner.averageRating > 0 ? owner.averageRating : 'New'}</span>
            {owner.ratingCount > 0 && (
              <span className="text-stone-400 text-[10px]">({owner.ratingCount})</span>
            )}
          </div>
        </div>

        {/* Availability Badge */}
        {owner.availability && (
          <div className="text-[11px] text-stone-600 flex items-center gap-1.5 mb-3.5 neo-inset px-2.5 py-1.5 rounded-lg font-medium">
            <Clock className="w-3.5 h-3.5 text-[#E05504] flex-shrink-0" />
            <span className="truncate">{owner.availability}</span>
          </div>
        )}

        {/* Action Button */}
        {isOwner ? (
          <div className="w-full py-2 text-center text-xs font-semibold text-slate-400 neo-inset rounded-xl">
            Your Listed Skill
          </div>
        ) : (
          <button
            onClick={() => onRequestSwap(skill)}
            className="w-full py-2.5 px-4 text-xs font-semibold neo-btn-primary rounded-xl flex items-center justify-center gap-2 group-hover:shadow-md transition-all"
          >
            <span>Request Swap</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SkillCard;
