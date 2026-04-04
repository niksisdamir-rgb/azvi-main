import React from 'react';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';

export function DeliveryTimeline({ deliveryId }: { deliveryId: number }) {
  const { data: history, isLoading } = trpc.tracking.getDeliveryHistory.useQuery({ deliveryId });

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading timeline...</div>;
  }

  if (!history || history.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">No tracking history found.</div>;
  }

  return (
    <div className="space-y-6 py-2">
      <div className="relative space-y-4">
        {/* Connection line */}
        <div className="absolute left-4 top-3 bottom-3 w-[2px] bg-white/10" />
        
        {history.map((event: any, idx: number) => {
          const isLatest = idx === history.length - 1;
          const statusConfig = getStatusLabel(event.status);
          const Icon = statusConfig.icon;
          
          return (
            <div key={event.id} className="relative pl-12 group">
              <div className={`absolute left-0 p-2 rounded-full border shadow-lg transition-transform group-hover:scale-110 ${
                isLatest ? 'bg-orange-500 border-orange-400 text-white z-10' : 'bg-zinc-900 border-white/10 text-white/50'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                isLatest 
                ? 'bg-orange-500/10 border-orange-500/30' 
                : 'bg-white/5 border-white/5 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold tracking-wide ${isLatest ? 'text-orange-400' : 'text-white/70'}`}>
                    {statusConfig.label}
                  </h4>
                  <span className="text-[10px] font-mono text-white/40 uppercase">
                    {format(new Date(event.timestamp), 'HH:mm • dd.MM')}
                  </span>
                </div>
                {event.location && (
                  <p className="text-xs text-white/50 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                )}
                {event.notes && (
                   <p className="text-xs text-white/40 italic mt-2 border-l-2 border-white/10 pl-2">
                    "{event.notes}"
                   </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
