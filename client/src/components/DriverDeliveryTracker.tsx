import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Camera, MapPin, Navigation, CheckCircle, Truck, Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface DriverDeliveryTrackerProps {
  deliveryId: number;
  onComplete?: () => void;
}

export function DriverDeliveryTracker({ deliveryId, onComplete }: DriverDeliveryTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [driverNotes, setDriverNotes] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: deliveries, refetch } = trpc.deliveries.list.useQuery();
  const delivery = deliveries?.find(d => d.id === deliveryId);

  const updateStatus = trpc.deliveries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status ažuriran / Status updated');
      refetch();
    },
  });

  const uploadPhoto = trpc.deliveries.uploadDeliveryPhoto.useMutation({
    onSuccess: () => {
      toast.success('Fotografija sačuvana / Photo saved');
    },
  });

  // Start GPS tracking
  useEffect(() => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          setCurrentLocation(location);
        },
        (error) => {
          console.error('GPS error:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setWatchId(id);

      return () => {
        if (id) navigator.geolocation.clearWatch(id);
      };
    }
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    await updateStatus.mutateAsync({
      id: deliveryId,
      status: newStatus as any,
      gpsLocation: currentLocation,
      driverNotes: driverNotes || undefined,
    });
    setDriverNotes('');

    // If it's a critical status, notify supervisor (simulated)
    if (newStatus === 'arrived' || newStatus === 'delivered') {
      toast('Supervizor obavešten / Supervisor notified', { icon: '🔔' });
    }
  };

  const simulateArrival = () => {
    if (delivery?.status === 'en_route') {
      handleStatusUpdate('arrived');
      toast.info('Simuliran dolazak na lokaciju / Simulated arrival at location');
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const photoData = base64.split(',')[1];

      await uploadPhoto.mutateAsync({
        deliveryId,
        photoData,
        mimeType: file.type,
      });
    };

    reader.readAsDataURL(file);
  };

  if (!delivery) {
    return <div className="text-white">Loading delivery...</div>;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-gray-500',
      loaded: 'bg-blue-500',
      en_route: 'bg-yellow-500',
      arrived: 'bg-purple-500',
      delivered: 'bg-green-500',
      returning: 'bg-orange-500',
      completed: 'bg-green-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  const statusFlow = [
    { key: 'scheduled', label: 'Zakazano / Scheduled', icon: Package },
    { key: 'loaded', label: 'Natovareno / Loaded', icon: Truck },
    { key: 'en_route', label: 'Na putu / En Route', icon: Navigation },
    { key: 'arrived', label: 'Stigao / Arrived', icon: MapPin },
    { key: 'delivered', label: 'Isporučeno / Delivered', icon: CheckCircle },
    { key: 'returning', label: 'Vraćanje / Returning', icon: ArrowRight },
  ];

  const currentStepIndex = statusFlow.findIndex(s => s.key === delivery.status);
  const nextStep = statusFlow[currentStepIndex + 1];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Delivery Info Card */}
      <Card className="bg-card/90 backdrop-blur border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            Isporuka #{delivery.id} / Delivery #{delivery.id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Projekat / Project</p>
              <p className="font-medium">{delivery.projectName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tip betona / Concrete Type</p>
              <p className="font-medium">{delivery.concreteType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Količina / Volume</p>
              <p className="font-medium">{delivery.volume} m³</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vozilo / Vehicle</p>
              <p className="font-medium">{delivery.vehicleNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-4 p-3 bg-muted/50 rounded border border-border">
            <p className="text-sm text-muted-foreground mb-2">Trenutni status / Current Status</p>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded text-white ${getStatusColor(delivery.status)}`}>
              {statusFlow.find(s => s.key === delivery.status)?.icon &&
                (() => {
                  const Icon = statusFlow.find(s => s.key === delivery.status)!.icon;
                  return <Icon className="w-4 h-4" />;
                })()
              }
              <span className="font-medium">
                {statusFlow.find(s => s.key === delivery.status)?.label || delivery.status}
              </span>
            </div>
          </div>

          {/* GPS Location */}
          {currentLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-green-500" />
              GPS: {currentLocation}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Progress */}
      <Card className="bg-card/90 backdrop-blur border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Tok isporuke / Delivery Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statusFlow.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-3 rounded ${isCurrent ? 'bg-orange-500/20 border border-orange-500/50' :
                    isCompleted ? 'bg-green-500/10 border border-green-500/30' :
                      'bg-muted/30'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isCurrent ? 'text-orange-500' :
                    isCompleted ? 'text-green-500' :
                      'text-muted-foreground'
                    }`} />
                  <span className={`flex-1 ${isCurrent ? 'font-bold text-white' :
                    isCompleted ? 'text-white' :
                      'text-muted-foreground'
                    }`}>
                    {step.label}
                  </span>
                  {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {nextStep && delivery.status !== 'completed' && delivery.status !== 'cancelled' && (
        <Card className="bg-card/90 backdrop-blur border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Akcije / Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Napomene / Notes (opciono)
              </label>
              <Textarea
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                placeholder="Dodajte napomene... / Add notes..."
                rows={3}
                className="text-base"
              />
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Fotografija / Photo
              </Button>

              <Button
                onClick={() => handleStatusUpdate(nextStep.key)}
                disabled={updateStatus.isPending || !currentLocation}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {updateStatus.isPending ? (
                  'Ažuriranje... / Updating...'
                ) : (
                  <>
                    <nextStep.icon className="w-4 h-4 mr-2" />
                    {nextStep.label.split(' / ')[0]}
                  </>
                )}
              </Button>
            </div>

            {delivery.status === 'en_route' && (
              <Button
                variant="secondary"
                onClick={simulateArrival}
                className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Simuliraj dolazak / Simulate Arrival
              </Button>
            )}

            {!currentLocation && (
              <p className="text-xs text-yellow-500">
                Čeka se GPS lokacija... / Waiting for GPS location...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delivery Photos */}
      {(() => {
        let photos: string[] = [];
        try {
          photos = Array.isArray(delivery.deliveryPhotos)
            ? delivery.deliveryPhotos
            : typeof delivery.deliveryPhotos === 'string'
              ? JSON.parse(delivery.deliveryPhotos)
              : [];
        } catch(e) {}
        
        if (photos.length === 0) return null;
        
        return (
          <Card className="bg-card/90 backdrop-blur border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Fotografije / Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo: string, idx: number) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Delivery photo ${idx + 1}`}
                    className="w-full h-24 object-cover rounded border border-border"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
