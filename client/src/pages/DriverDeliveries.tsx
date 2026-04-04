import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard';
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle } from '@/components/ui/GlassDialog';
import { Button } from '@/components/ui/button';
import { DriverDeliveryTracker } from '@/components/DriverDeliveryTracker';
import { trpc } from '@/lib/trpc';
import { Truck, Package, Navigation } from 'lucide-react';

export default function DriverDeliveries() {
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  const { data: deliveries, isLoading } = trpc.deliveries.list.useQuery();

  // Filter deliveries assigned to current user or active deliveries
  const myDeliveries = deliveries?.filter(d => 
    ['scheduled', 'loaded', 'en_route', 'arrived', 'delivered', 'returning'].includes(d.status)
  ) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      loaded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      en_route: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      arrived: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
      returning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Deliveries / Isporuke vozača</h1>
          <p className="text-white/70">Track and manage your deliveries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading deliveries...
            </div>
          ) : myDeliveries.length > 0 ? (
            myDeliveries.map((delivery) => (
              <GlassCard
                key={delivery.id}
                className="border-orange-500/20 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedDelivery(delivery.id)}
              >
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="w-5 h-5 text-orange-500" />
                    Isporuka #{delivery.id}
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Projekat / Project</p>
                    <p className="font-medium text-white">{delivery.projectName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tip / Type</p>
                      <p className="text-sm text-white">{delivery.concreteType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Količina / Volume</p>
                      <p className="text-sm text-white">{delivery.volume} m³</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Zakazano / Scheduled</p>
                    <p className="text-sm text-white">
                      {new Date(delivery.scheduledTime).toLocaleString()}
                    </p>
                  </div>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    <Navigation className="w-4 h-4 mr-2" />
                    Otvori / Open
                  </Button>
                </GlassCardContent>
              </GlassCard>
            ))
          ) : (
            <GlassCard variant="card" className="col-span-full">
              <GlassCardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nema aktivnih isporuka / No active deliveries
                </p>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Delivery Tracker Dialog */}
      <GlassDialog open={selectedDelivery !== null} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <GlassDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <GlassDialogHeader>
            <GlassDialogTitle>Praćenje isporuke / Delivery Tracking</GlassDialogTitle>
          </GlassDialogHeader>
          {selectedDelivery && (
            <DriverDeliveryTracker
              deliveryId={selectedDelivery}
              onComplete={() => setSelectedDelivery(null)}
            />
          )}
        </GlassDialogContent>
      </GlassDialog>
    </DashboardLayout>
  );
}
