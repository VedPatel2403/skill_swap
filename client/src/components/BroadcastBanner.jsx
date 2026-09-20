import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, Info, X } from 'lucide-react';
import api from '../api/axiosClient';

const BroadcastBanner = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissed_broadcasts') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const response = await api.get('/admin/broadcasts/active');
        setBroadcasts(response.data || []);
      } catch (err) {
        // Silently fail if server unreached
      }
    };
    fetchBroadcasts();
  }, []);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    sessionStorage.setItem('dismissed_broadcasts', JSON.stringify(updated));
  };

  const activeVisible = broadcasts.filter(b => !dismissedIds.includes(b.id));

  if (activeVisible.length === 0) return null;

  return (
    <div className="space-y-1">
      {activeVisible.map((broadcast) => {
        const isMaintenance = broadcast.type === 'maintenance';
        const isUpdate = broadcast.type === 'update';

        let bgClass = 'bg-[#F0ECC7]/70 border-[#d8d1a8] text-[#44403c]';
        let icon = <Info className="w-5 h-5 text-[#E05504] flex-shrink-0" />;

        if (isMaintenance) {
          bgClass = 'bg-[#FAA121]/15 border-[#FAA121]/40 text-[#78350f]';
          icon = <AlertCircle className="w-5 h-5 text-[#FAA121] flex-shrink-0" />;
        } else if (isUpdate) {
          bgClass = 'bg-[#AFDFB5]/35 border-[#AFDFB5]/70 text-[#14532d]';
          icon = <Bell className="w-5 h-5 text-[#166534] flex-shrink-0" />;
        }

        return (
          <div
            key={broadcast.id}
            className={`border-b px-4 py-3 sm:px-6 transition-all duration-200 ${bgClass}`}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {icon}
                <div className="text-sm">
                  <span className="font-semibold mr-2">{broadcast.title}</span>
                  <span className="opacity-90">{broadcast.message}</span>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(broadcast.id)}
                className="p-1 rounded-md hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
                title="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BroadcastBanner;
