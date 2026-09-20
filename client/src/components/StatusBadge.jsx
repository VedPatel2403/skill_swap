import React from 'react';

const StatusBadge = ({ status, type = 'status' }) => {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-[#FAA121]/20 text-[#78350f] border-[#FAA121]/60';
      case 'accepted':
      case 'active':
      case 'public':
        return 'bg-[#AFDFB5]/40 text-[#166534] border-[#AFDFB5]';
      case 'completed':
        return 'bg-[#AFDFB5]/50 text-[#14532d] border-[#AFDFB5] font-semibold';
      case 'rejected':
      case 'cancelled':
      case 'banned':
        return 'bg-rose-100/70 text-rose-800 border-rose-300';
      case 'flagged':
        return 'bg-[#FAA121]/25 text-[#9a3412] border-[#FAA121]/70';
      case 'offered':
        return 'bg-[#FAA121]/20 text-[#b45309] border-[#FAA121]/50';
      case 'wanted':
        return 'bg-[#E05504]/15 text-[#9a3412] border-[#E05504]/40';
      case 'private':
        return 'bg-[#F0ECC7] text-[#57534e] border-[#d8d1a8]';
      case 'expert':
        return 'bg-[#E05504]/20 text-[#9a3412] border-[#E05504]/50 font-semibold';
      case 'advanced':
        return 'bg-[#FAA121]/25 text-[#78350f] border-[#FAA121]/60';
      case 'intermediate':
        return 'bg-[#AFDFB5]/30 text-[#166534] border-[#AFDFB5]/70';
      case 'beginner':
        return 'bg-[#F0ECC7] text-[#57534e] border-[#d8d1a8]';
      default:
        return 'bg-[#F0ECC7]/70 text-[#57534e] border-[#d8d1a8]';
    }
  };

  const getLabel = () => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
