import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Truck, MapPin, Camera, CheckCircle, Navigation, Package,
  ArrowRight, AlertCircle, Clock, Phone, ChevronRight,
  Wifi, WifiOff, Battery, Signal, RefreshCw, Menu, X,
  Home, Loader2, ImagePlus, FileText, RotateCcw
} from 'lucide-react';

// ── types ────────────────────────────────────────────────────────────────────
type DeliveryStatus =
  | 'scheduled' | 'loaded' | 'en_route' | 'arrived'
  | 'delivered' | 'returning' | 'completed' | 'cancelled';

interface StatusStep {
  key: DeliveryStatus;
  label: string;
  labelBs: string;
  icon: React.ElementType;
  color: string;
  glow: string;
}

const STATUS_STEPS: StatusStep[] = [
  { key: 'scheduled', label: 'Scheduled',  labelBs: 'Zakazano',   icon: Clock,        color: '#6b7280', glow: 'rgba(107,114,128,0.4)' },
  { key: 'loaded',    label: 'Loaded',     labelBs: 'Natovareno', icon: Package,      color: '#3b82f6', glow: 'rgba(59,130,246,0.4)'  },
  { key: 'en_route',  label: 'En Route',   labelBs: 'Na putu',    icon: Navigation,   color: '#f59e0b', glow: 'rgba(245,158,11,0.4)'  },
  { key: 'arrived',   label: 'Arrived',    labelBs: 'Stigao',     icon: MapPin,       color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)'  },
  { key: 'delivered', label: 'Delivered',  labelBs: 'Isporučeno', icon: CheckCircle,  color: '#10b981', glow: 'rgba(16,185,129,0.4)'  },
  { key: 'returning', label: 'Returning',  labelBs: 'Vraćanje',   icon: RotateCcw,    color: '#f97316', glow: 'rgba(249,115,22,0.4)'  },
  { key: 'completed', label: 'Completed',  labelBs: 'Završeno',   icon: CheckCircle,  color: '#22c55e', glow: 'rgba(34,197,94,0.4)'   },
];

const VALID_NEXT: Record<string, DeliveryStatus> = {
  scheduled: 'loaded',
  loaded:    'en_route',
  en_route:  'arrived',
  arrived:   'delivered',
  delivered: 'returning',
  returning: 'completed',
};

// ── helpers ──────────────────────────────────────────────────────────────────
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function useGPS() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS not supported');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { coords, error };
}

function formatETA(unixSeconds: number | null) {
  if (!unixSeconds) return null;
  const diff = unixSeconds - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Arriving';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getStep(status: string): StatusStep {
  return STATUS_STEPS.find(s => s.key === status) ?? STATUS_STEPS[0];
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function DriverApp() {
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [notes, setNotes]               = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isOnline, setIsOnline]         = useState(navigator.onLine);
  const fileRef = useRef<HTMLInputElement>(null);

  const { coords, error: gpsError } = useGPS();

  // online/offline
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // queries
  const { data: deliveries, isLoading, refetch } = trpc.tracking.getAllDeliveries.useQuery(
    { statusFilter: 'active' }, { refetchInterval: 15_000 }
  );
  const { data: selected, refetch: refetchOne } = trpc.tracking.getById.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null, refetchInterval: 10_000 }
  );
  const { data: history } = trpc.tracking.getDeliveryHistory.useQuery(
    { deliveryId: selectedId! },
    { enabled: selectedId !== null }
  );

  // mutations
  const updateStatus = trpc.tracking.updateDeliveryStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Status → ${vars.status.replace('_', ' ').toUpperCase()}`);
      refetch(); refetchOne();
    },
    onError: (e) => toast.error(e.message),
  });

  const calcETA = trpc.tracking.calculateETA.useMutation({
    onSuccess: (data) => {
      toast.success(`ETA updated: ${formatETA(data.estimatedArrival)}`);
      refetchOne();
    },
  });

  const uploadPhoto = trpc.tracking.uploadDeliveryPhoto.useMutation({
    onSuccess: () => {
      toast.success('Photo uploaded');
      setPhotoPreview(null);
      refetchOne();
    },
    onError: (e) => toast.error(e.message),
  });

  // auto-arrival logic
  const isUpdatingRef = useRef(false);
  useEffect(() => {
    if (!selected || selected.status !== 'en_route') return;
    if (!coords || !selected.projectLocation) return;
    if (updateStatus.isPending || isUpdatingRef.current) return;

    const [destLatStr, destLngStr] = selected.projectLocation.split(',');
    const destLat = parseFloat(destLatStr);
    const destLng = parseFloat(destLngStr);

    if (isNaN(destLat) || isNaN(destLng)) return;

    const distanceKm = calculateHaversineDistance(coords.lat, coords.lng, destLat, destLng);
    
    if (distanceKm <= 0.2) {
      isUpdatingRef.current = true;
      toast('Approaching project site! Automatically updating status to Arrived.', { icon: '📍' });
      updateStatus.mutateAsync({
        deliveryId: selected.id,
        status: 'arrived',
        latitude: coords.lat,
        longitude: coords.lng,
      }).finally(() => {
        isUpdatingRef.current = false;
      });
    }
  }, [coords, selected, updateStatus]);

  // handlers
  const handleAdvance = useCallback(async () => {
    if (!selected) return;
    const next = VALID_NEXT[selected.status];
    if (!next) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate(50);

    await updateStatus.mutateAsync({
      deliveryId: selected.id,
      status: next,
      latitude:  coords?.lat,
      longitude: coords?.lng,
      notes: notes || undefined,
    });
    setNotes('');
  }, [selected, coords, notes, updateStatus]);

  const internalUpload = async (base64: string, mime: string) => {
    if (!selected) return;
    await uploadPhoto.mutateAsync({
      deliveryId: selected.id,
      photoData: base64,
      mimeType: mime,
      latitude:  coords?.lat,
      longitude: coords?.lng,
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      
      // Auto-upload
      const base64 = result.split(',')[1];
      const mime   = result.split(';')[0].split(':')[1];
      await internalUpload(base64, mime);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateETA = async () => {
    if (!selected || !coords) return;
    await calcETA.mutateAsync({
      deliveryId: selected.id,
      latitude: coords.lat,
      longitude: coords.lng,
    });
  };

  // ── render: no delivery selected ──────────────────────────────────────────
  if (!selectedId || !selected) {
    return (
      <div style={styles.shell}>
        {/* Status bar */}
        <div style={styles.statusBar}>
          <div style={styles.statusBarItems}>
            <span style={styles.timeText}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={styles.statusBarItems}>
            {isOnline ? <Wifi size={14} color="#22c55e" /> : <WifiOff size={14} color="#ef4444" />}
            {gpsError ? <Signal size={14} color="#ef4444" /> : <MapPin size={14} color="#22c55e" />}
          </div>
        </div>

        {/* Hero header */}
        <div style={styles.heroHeader}>
          <div style={styles.heroLogo}>
            <Truck size={28} color="#f97316" />
            <span style={styles.heroTitle}>AzVirt Driver</span>
          </div>
          <p style={styles.heroSub}>Select your delivery to begin</p>
        </div>

        {/* Delivery list */}
        <div style={styles.listContainer}>
          {isLoading ? (
            <div style={styles.center}>
              <Loader2 size={32} color="#f97316" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={styles.mutedText}>Loading deliveries…</p>
            </div>
          ) : !deliveries?.length ? (
            <div style={styles.center}>
              <Package size={48} color="#374151" />
              <p style={styles.mutedText}>No active deliveries</p>
              <p style={{ ...styles.mutedText, fontSize: 12, marginTop: 4 }}>Nema aktivnih isporuka</p>
              <button onClick={() => refetch()} style={styles.ghostBtn}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          ) : (
            <div style={styles.cardList}>
              {deliveries.map((d: any) => {
                const step = getStep(d.status);
                const Icon = step.icon;
                const eta = formatETA(d.estimatedArrival ?? null);
                return (
                  <button key={d.id} style={styles.deliveryCard} onClick={() => setSelectedId(d.id)}>
                    <div style={{ ...styles.cardAccent, background: step.color }} />
                    <div style={styles.cardBody}>
                      <div style={styles.cardRow}>
                        <div style={styles.cardIconWrap}>
                          <Icon size={18} color={step.color} />
                        </div>
                        <div style={styles.cardInfo}>
                          <p style={styles.cardTitle}>{d.projectName}</p>
                          <p style={styles.cardSub}>{d.concreteType} · {d.volume} m³</p>
                        </div>
                        <ChevronRight size={18} color="#6b7280" />
                      </div>
                      <div style={styles.cardFooter}>
                        <span style={{ ...styles.statusPill, background: `${step.color}22`, color: step.color, border: `1px solid ${step.color}44` }}>
                          {step.labelBs}
                        </span>
                        {eta && (
                          <span style={styles.etaChip}>
                            <Clock size={11} /> {eta}
                          </span>
                        )}
                        {d.vehicleNumber && (
                          <span style={styles.vehicleChip}>{d.vehicleNumber}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <style>{spinKeyframes}</style>
      </div>
    );
  }

  // ── render: delivery detail view ──────────────────────────────────────────
  const currentStep = getStep(selected.status);
  const CurrentIcon = currentStep.icon;
  const nextStatus  = VALID_NEXT[selected.status] as DeliveryStatus | undefined;
  const nextStep    = nextStatus ? getStep(nextStatus) : null;
  const currentIdx  = STATUS_STEPS.findIndex(s => s.key === selected.status);
  const eta         = formatETA(selected.estimatedArrival ?? null);

  const canAdvance  = !!nextStatus &&
    selected.status !== 'completed' &&
    selected.status !== 'cancelled';

  const photos: any[] = Array.isArray(selected.deliveryPhotos)
    ? selected.deliveryPhotos
    : [];

  return (
    <div style={styles.shell}>
      <style>{spinKeyframes}</style>

      {/* Top nav */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => setSelectedId(null)}>
          <Home size={18} color="#f97316" />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={styles.navTitle}>Isporuka #{selected.id}</p>
          <p style={styles.navSub}>{selected.projectName}</p>
        </div>
        <button style={styles.menuBtn} onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div style={styles.dropMenu}>
          <button style={styles.dropItem} onClick={() => { refetchOne(); setMenuOpen(false); }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {coords && selected.status === 'en_route' && (
            <button style={styles.dropItem} onClick={() => { handleUpdateETA(); setMenuOpen(false); }}>
              <Clock size={14} /> Update ETA
            </button>
          )}
          {selected.customerPhone && (
            <a href={`tel:${selected.customerPhone}`} style={styles.dropItem}>
              <Phone size={14} /> Call Customer
            </a>
          )}
        </div>
      )}

      <div style={styles.scrollArea}>
        {/* Status hero card - NOW INTERACTIVE for one-tap progression */}
        <div 
          style={{ 
            ...styles.heroCard, 
            boxShadow: `0 0 60px ${currentStep.glow}`,
            cursor: canAdvance ? 'pointer' : 'default',
            borderColor: canAdvance ? `${currentStep.color}66` : '#1f2937'
          }}
          onClick={canAdvance ? handleAdvance : undefined}
        >
          <div style={styles.heroCardInner}>
            <div style={{ 
              ...styles.bigIconWrap, 
              background: `linear-gradient(135deg, ${currentStep.color}33, ${currentStep.color}11)`, 
              boxShadow: `0 0 30px ${currentStep.glow}`,
              border: `1px solid ${currentStep.color}44`
            }}>
              {updateStatus.isPending ? (
                <Loader2 size={42} color={currentStep.color} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <CurrentIcon size={42} color={currentStep.color} />
              )}
            </div>
            <p style={styles.bigStatus}>{currentStep.labelBs}</p>
            <p style={{ ...styles.bigStatus, fontSize: 14, color: '#9ca3af', marginTop: 2 }}>{currentStep.label}</p>
            
            {canAdvance && nextStep && (
              <div style={{ ...styles.nextLabel, color: nextStep.color }}>
                <span>Sljedeći korak: {nextStep.labelBs}</span>
                <ArrowRight size={14} />
              </div>
            )}

            {eta && (
              <div style={styles.etaBadge}>
                <Clock size={13} color="#f97316" />
                <span>ETA: {eta}</span>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div style={styles.infoGrid}>
            <InfoCell label="Tip / Type" value={selected.concreteType} />
            <InfoCell label="Količina / Vol" value={`${selected.volume} m³`} />
            <InfoCell label="Vozilo" value={selected.vehicleNumber ?? '—'} />
            <InfoCell label="Vozač" value={selected.driverName ?? '—'} />
          </div>

          {/* GPS */}
          {coords ? (
            <div style={styles.gpsPill}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#22c55e', fontSize: 11 }}>GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
            </div>
          ) : (
            <div style={styles.gpsPill}>
              <AlertCircle size={12} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: 11 }}>GPS not available</span>
            </div>
          )}
        </div>

        {/* Progress stepper */}
        <div style={styles.section}>
          <p style={styles.sectionTitle}>Progress</p>
          <div style={styles.stepper}>
            {STATUS_STEPS.filter(s => s.key !== 'cancelled').map((step, idx) => {
              const done    = idx < currentIdx;
              const current = idx === currentIdx;
              const StepIcon = step.icon;
              return (
                <div key={step.key} style={styles.stepRow}>
                  <div style={{
                    ...styles.stepDot,
                    background:   done || current ? step.color : '#1f2937',
                    boxShadow:    current ? `0 0 12px ${step.glow}` : 'none',
                    border:       current ? `2px solid ${step.color}` : `2px solid ${done ? step.color : '#374151'}`,
                  }}>
                    <StepIcon size={12} color={done || current ? '#fff' : '#6b7280'} />
                  </div>
                  {idx < STATUS_STEPS.length - 2 && (
                    <div style={{ ...styles.stepLine, background: done ? step.color : '#1f2937' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ ...styles.stepLabel, color: current ? step.color : done ? '#d1d5db' : '#6b7280', fontWeight: current ? 600 : 400 }}>
                      {step.labelBs}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action section */}
        {canAdvance && nextStep && (
          <div style={styles.section}>
            <p style={styles.sectionTitle}>Akcije / Actions</p>

            {/* Notes */}
            <textarea
              placeholder="Napomene za dispečera… / Notes for dispatch…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={styles.notesInput}
              rows={2}
            />

            {/* Photo capture - One tap trigger */}
            <div style={styles.photoRow}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <button 
                style={{ 
                  ...styles.photoBtn, 
                  background: 'rgba(31, 41, 55, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }} 
                onClick={() => fileRef.current?.click()}
                disabled={uploadPhoto.isPending}
              >
                {uploadPhoto.isPending ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Camera size={18} />
                )}
                <span>Dodaj Fotografiju / Add Photo</span>
              </button>
            </div>
            
            {photoPreview && uploadPhoto.isPending && (
              <div style={styles.uploadOverlay}>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill} />
                </div>
                <span style={styles.uploadText}>Uploading...</span>
              </div>
            )}

            {photoPreview && !uploadPhoto.isPending && (
              <img src={photoPreview} alt="Preview" style={styles.photoPreview} />
            )}
          </div>
        )}

        {selected.status === 'completed' && (
          <div style={styles.completedBanner}>
            <CheckCircle size={32} color="#22c55e" />
            <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 18, marginTop: 8 }}>Isporuka završena!</p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Delivery completed</p>
          </div>
        )}

        {/* Photos gallery */}
        {photos.length > 0 && (
          <div style={styles.section}>
            <p style={styles.sectionTitle}>Fotografije / Photos ({photos.length})</p>
            <div style={styles.photoGrid}>
              {photos.map((photo: any, i: number) => {
                const src = typeof photo === 'string' ? photo : photo?.url;
                if (!src) return null;
                return (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer" style={styles.photoThumbLink}>
                    <img src={src} alt={`Delivery photo ${i + 1}`} style={styles.photoThumb} />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Status history */}
        {history && history.length > 0 && (
          <div style={{ ...styles.section, marginBottom: 32 }}>
            <p style={styles.sectionTitle}>
              <FileText size={14} style={{ display: 'inline', marginRight: 6 }} />
              Timeline
            </p>
            <div style={styles.timeline}>
              {[...history].reverse().map((h, i) => {
                const step = getStep(h.status);
                const HIcon = step.icon;
                return (
                  <div key={h.id} style={styles.timelineItem}>
                    <div style={{ ...styles.timelineDot, background: step.color }}>
                      <HIcon size={10} color="#fff" />
                    </div>
                    <div style={styles.timelineContent}>
                      <p style={{ color: step.color, fontSize: 13, fontWeight: 600 }}>{step.labelBs}</p>
                      <p style={styles.timelineSub}>{new Date(h.timestamp).toLocaleString()}</p>
                      {h.notes && <p style={{ ...styles.timelineSub, color: '#9ca3af' }}>{h.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoCell}>
      <p style={styles.infoCellLabel}>{label}</p>
      <p style={styles.infoCellValue}>{value}</p>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const spinKeyframes = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; transform: scale(1); } }
  @keyframes loadProgress { from { width: 0%; } to { width: 100%; } }
`;

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100dvh',
    maxWidth: 480,
    margin: '0 auto',
    background: '#030712',
    color: '#f9fafb',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative',
    overflowX: 'hidden',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px 4px',
    background: '#030712',
  },
  statusBarItems: { display: 'flex', gap: 8, alignItems: 'center' },
  timeText: { fontSize: 12, color: '#9ca3af', fontWeight: 600 },
  heroHeader: {
    padding: '24px 20px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'linear-gradient(to bottom, #030712, #0d1117)',
  },
  heroLogo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  heroTitle: { fontSize: 24, fontWeight: 900, letterSpacing: -0.8, background: 'linear-gradient(to right, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { fontSize: 13, color: '#9ca3af', marginTop: 2, fontWeight: 500 },
  listContainer: { padding: '16px 0' },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12, padding: '60px 20px',
  },
  mutedText: { color: '#6b7280', fontSize: 14 },
  ghostBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: '1px solid #374151',
    color: '#9ca3af', cursor: 'pointer', padding: '8px 16px',
    borderRadius: 8, fontSize: 13, marginTop: 8,
  },
  cardList: { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' },
  deliveryCard: {
    display: 'flex', 
    background: 'rgba(17, 24, 39, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    borderRadius: 20,
    overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
    padding: 0, position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardAccent: { width: 6, flexShrink: 0 },
  cardBody: { flex: 1, padding: '16px 18px 14px' },
  cardRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    background: 'rgba(31, 41, 55, 0.8)', display: 'grid', placeItems: 'center', flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.05)'
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  cardFooter: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  statusPill: {
    padding: '3px 12px', borderRadius: 24, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5
  },
  etaChip: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: '#fdd6b1', background: 'rgba(249,115,22,0.15)',
    padding: '3px 10px', borderRadius: 24, border: '1px solid rgba(249,115,22,0.3)',
  },
  vehicleChip: {
    fontSize: 11, color: '#9ca3af', background: 'rgba(31, 41, 55, 0.8)',
    padding: '3px 10px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)'
  },
  topNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', borderBottom: '1px solid #111827',
    background: '#030712', position: 'sticky', top: 0, zIndex: 50,
  },
  backBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 },
  menuBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#9ca3af', borderRadius: 8 },
  navTitle: { fontSize: 14, fontWeight: 700, color: '#f9fafb' },
  navSub: { fontSize: 11, color: '#6b7280' },
  dropMenu: {
    position: 'absolute', top: 56, right: 16, zIndex: 100,
    background: '#111827', border: '1px solid #1f2937', borderRadius: 12,
    overflow: 'hidden', width: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '12px 16px', background: 'transparent', border: 'none',
    color: '#d1d5db', fontSize: 14, cursor: 'pointer', textDecoration: 'none',
  },
  scrollArea: { overflowY: 'auto', paddingBottom: 32 },
  heroCard: {
    margin: 16, borderRadius: 20, background: '#0d1117',
    border: '1px solid #1f2937', padding: '24px 20px 16px',
    transition: 'box-shadow 0.5s',
  },
  heroCardInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 },
  bigIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    display: 'grid', placeItems: 'center', marginBottom: 12,
  },
  bigStatus: { fontSize: 22, fontWeight: 800, color: '#f9fafb', letterSpacing: -0.5 },
  nextLabel: {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 700,
  },
  etaBadge: {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
    background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
    borderRadius: 24, padding: '5px 16px', fontSize: 14, color: '#fb923c', fontWeight: 600,
  },
  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    borderTop: '1px solid #1f2937', paddingTop: 16, marginBottom: 12,
  },
  infoCell: {
    background: '#111827', borderRadius: 10,
    padding: '10px 12px',
  },
  infoCellLabel: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCellValue: { fontSize: 14, fontWeight: 600, color: '#f9fafb', marginTop: 2 },
  gpsPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: 4,
  },
  section: { margin: '0 16px 16px' },
  sectionTitle: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 },
  stepper: { display: 'flex', flexDirection: 'column', gap: 0 },
  stepRow: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 2 },
  stepDot: {
    width: 24, height: 24, borderRadius: '50%',
    display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2,
    transition: 'background 0.3s, box-shadow 0.3s',
  },
  stepLine: {
    width: 2, height: 18, margin: '2px 0 2px 10px', borderRadius: 2,
    transition: 'background 0.3s',
  },
  stepLabel: { fontSize: 14, marginTop: 3, transition: 'color 0.3s' },
  notesInput: {
    width: '100%', background: '#111827', border: '1px solid #1f2937',
    borderRadius: 12, color: '#f9fafb', padding: '12px 14px', fontSize: 14,
    resize: 'none', outline: 'none', marginBottom: 12, boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  advanceBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: '16px', borderRadius: 14, border: 'none',
    cursor: 'pointer', color: '#fff', fontSize: 16, fontWeight: 700,
    letterSpacing: -0.3, marginBottom: 12, transition: 'opacity 0.2s',
  },
  photoRow: { display: 'flex', gap: 10, marginBottom: 12 },
  photoBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '12px', borderRadius: 12, border: 'none',
    background: '#1f2937', color: '#f9fafb', cursor: 'pointer',
    fontSize: 14, fontWeight: 600,
  },
  photoPreview: {
    width: '100%', height: 180, objectFit: 'cover', borderRadius: 12,
    border: '1px solid #1f2937', marginBottom: 12,
  },
  completedBanner: {
    margin: 16, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 16, padding: '32px 20px', textAlign: 'center',
  },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  photoThumbLink: { display: 'block', borderRadius: 10, overflow: 'hidden' },
  photoThumb: { width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' },
  timeline: { display: 'flex', flexDirection: 'column', gap: 12 },
  timelineItem: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  timelineDot: {
    width: 22, height: 22, borderRadius: '50%',
    display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2,
  },
  timelineContent: { flex: 1 },
  timelineSub: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  uploadOverlay: {
    width: '100%', padding: '12px', background: 'rgba(17, 24, 39, 0.4)',
    borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  progressBar: { width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#f97316', animation: 'loadProgress 2s ease-in-out infinite' },
  uploadText: { fontSize: 12, color: '#9ca3af', fontWeight: 500 },
};
