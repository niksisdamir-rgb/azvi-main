import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { MapPin, Truck, Clock, Navigation, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapView } from './Map';
import { DeliveryTimeline } from './DeliveryTimeline';
import { DeliveryPhotoGallery } from './DeliveryPhotoGallery';

export const LiveDeliveryMap = React.memo(function LiveDeliveryMap() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'delayed'>('active');
  const { data: deliveries, refetch } = trpc.tracking.getAllDeliveries.useQuery({ statusFilter: filter });
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const sendNotification = trpc.tracking.sendCustomerNotification.useMutation({
    onSuccess: () => {
      toast.success('SMS notification sent to customer');
      refetch();
    },
    onError: () => {
      toast.error('Failed to send SMS notification');
    },
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Update map markers when deliveries change
  useEffect(() => {
    if (!mapRef.current || !deliveries || !window.google) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidLocation = false;

    deliveries.forEach(delivery => {
      if (delivery.latitude && delivery.longitude) {
        hasValidLocation = true;
        
        // Create custom marker content depending on status
        const pinView = document.createElement('div');
        pinView.className = `w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg ${getStatusColor(delivery.status).replace('text-white', '')}`;
        pinView.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>';

        const position = { lat: delivery.latitude, lng: delivery.longitude };
        bounds.extend(position);

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position,
          title: `Delivery #${delivery.id} - ${delivery.projectName}`,
          content: pinView
        });

        markersRef.current.push(marker);
      }
    });

    if (hasValidLocation) {
      mapRef.current.fitBounds(bounds);
      // Prevent zooming in too close for single markers
      const listener = window.google.maps.event.addListener(mapRef.current, "idle", () => { 
        if (mapRef.current!.getZoom()! > 15) {
            mapRef.current!.setZoom(15);
        }
        window.google.maps.event.removeListener(listener); 
      });
    }

  }, [deliveries]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      loaded: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
      en_route: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
      arrived: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
      delivered: 'bg-green-600/20 text-green-400 border-green-500/30',
      returning: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
      completed: 'bg-zinc-800/40 text-zinc-400 border-zinc-700/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      loaded: 'Natovareno / Loaded',
      en_route: 'Na putu / En Route',
      arrived: 'Stigao / Arrived',
      delivered: 'Isporučeno / Delivered',
      completed: 'Završeno / Completed',
    };
    return labels[status] || status;
  };

  const calculateETA = (delivery: any) => {
    if (!delivery.estimatedArrival) return 'N/A';
    
    const eta = new Date(delivery.estimatedArrival * 1000);
    const now = new Date();
    const diffMinutes = Math.floor((eta.getTime() - now.getTime()) / 60000);
    
    if (diffMinutes < 0) return 'Late / Kasni';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
  };

  return (
    <div className="space-y-6">
      {/* Map View */}
      <Card className="bg-black/40 backdrop-blur-xl border-orange-500/20 overflow-hidden shadow-2xl group transition-all duration-500">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-md">
              <MapPin className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-semibold text-white uppercase tracking-wider">Live Tracking Map</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-[10px] text-white/50 uppercase tracking-tighter">Live Sync {autoRefresh ? 'Active' : 'Paused'}</span>
             </div>
             <Button variant="ghost" size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className="h-7 text-[10px] uppercase font-bold hover:bg-white/5 border border-white/5">
                {autoRefresh ? "Stop" : "Start"}
             </Button>
          </div>
        </div>
        <MapView 
            className="w-full h-[450px]" 
            onMapReady={(map) => { mapRef.current = map; }}
            initialCenter={{ lat: 43.8563, lng: 18.4131 }} // Default location
            initialZoom={10}
        />
      </Card>

      {/* Delivery List & Filters */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-xl">
        <CardHeader className="pb-4 border-b border-white/5 bg-black/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-orange-500/10 rounded-md">
                <Truck className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-lg">Pregled Isporuka</p>
                <p className="text-xs text-white/40 font-normal uppercase tracking-widest">Deliveries Overview</p>
              </div>
              <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono text-orange-400 border border-white/5 ml-2">
                {deliveries?.length || 0}
              </span>
            </CardTitle>
            
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full md:w-auto">
              <TabsList className="bg-black/40 border border-white/5 p-1 h-10 w-full md:w-auto">
                <TabsTrigger value="active" className="text-xs uppercase font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all px-4">Aktivne</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs uppercase font-bold data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all px-4">Završene</TabsTrigger>
                <TabsTrigger value="delayed" className="text-xs uppercase font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all px-4">Kasne</TabsTrigger>
                <TabsTrigger value="all" className="text-xs uppercase font-bold data-[state=active]:bg-zinc-700 data-[state=active]:text-white transition-all px-4">Sve</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!deliveries || deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nema isporuka za odabrani filter / No deliveries found for this filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => {
                let photos: string[] = [];
                try {
                  photos = Array.isArray(delivery.deliveryPhotos)
                    ? (delivery.deliveryPhotos as string[])
                    : typeof delivery.deliveryPhotos === 'string'
                      ? JSON.parse(delivery.deliveryPhotos as string)
                      : [];
                } catch(e) {}

                return (
                  <div
                    key={delivery.id}
                    className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg text-white">
                            #{delivery.id} - {delivery.projectName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                            {getStatusLabel(delivery.status)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-orange-400">
                          {delivery.concreteType} • {delivery.volume} m³
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Zakazano: {new Date(delivery.scheduledTime).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm bg-background/50 p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Vozač / Driver</p>
                          <p className="text-white font-medium">{delivery.driverName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Vozilo / Vehicle</p>
                          <p className="text-white font-medium">{delivery.vehicleNumber || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-muted-foreground text-xs">ETA:</span>
                            <span className={`font-semibold ${calculateETA(delivery).includes('Late') ? 'text-red-500 font-bold' : 'text-white'}`}>
                              {calculateETA(delivery)}
                            </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-border">
                      {/* Left Column: Details & Actions */}
                      <div className="space-y-4">
                         {delivery.driverNotes && (
                          <div className="p-3 bg-black/20 rounded-md border border-border">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">Napomene vozača / Driver Notes</p>
                            <p className="text-sm text-white italic">"{delivery.driverNotes}"</p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                           <DeliveryPhotoGallery photos={photos} />
                           
                           {delivery.customerPhone && delivery.status === 'en_route' && !delivery.smsNotificationSent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendNotification.mutate({
                                deliveryId: delivery.id
                              })}
                              disabled={sendNotification.isPending}
                              className="mt-2 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-500"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Notify Customer
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column: Timeline */}
                      <div className="bg-black/20 rounded-md border border-border overflow-hidden">
                        <DeliveryTimeline deliveryId={delivery.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} (every 30s)</span>
      </div>
    </div>
  );
});
