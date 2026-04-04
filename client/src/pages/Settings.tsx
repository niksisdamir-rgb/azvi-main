import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Phone, Bell, Save, Smartphone } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
const PUBLIC_VAPID_KEY = "BNprpveZnyHtp8Ovu-ybpHTWHAOctfC2tUzY8yUxmsyCcjaFttzzQNYlD2i6zNcS_0sVXOtca-mepyfL6oOeZiA";


export default function Settings() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [smsEnabled, setSmsEnabled] = useState(user?.smsNotificationsEnabled || false);
  const [isSaving, setIsSaving] = useState(false);

  const updateSMSMutation = trpc.auth.updateSMSSettings.useMutation({
    onSuccess: () => {
      toast.success("SMS podešavanja uspješno ažurirana");
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast.error(`Neuspjelo ažuriranje SMS podešavanja: ${error.message}`);
      setIsSaving(false);
    },
  });

  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const pushSubscribeMutation = trpc.push.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Push obavještenja uspješno omogućena");
      setPushEnabled(true);
      setIsSubscribing(false);
    },
    onError: (error) => {
      toast.error("Greška pri omogućavanju push obavještenja");
      setIsSubscribing(false);
    }
  });

  const handlePushToggle = async () => {
    if (pushEnabled) {
      toast.info("Push notifications cannot be disabled easily from browser once granted, revoke permission from site settings.");
      return;
    }
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
          });
        }
        pushSubscribeMutation.mutate({ subscription: JSON.stringify(subscription) });
      } else {
        setIsSubscribing(false);
        toast.error("Dozvola za notifikacije odbijena");
      }
    } catch (e) {
      console.error(e);
      toast.error("Greška");
      setIsSubscribing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error("Molimo unesite broj telefona");
      return;
    }

    setIsSaving(true);
    updateSMSMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      smsNotificationsEnabled: smsEnabled,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Podešavanja</h1>
          <p className="text-white/70">Upravljajte svojim preferencijama obavještenja</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <GlassCard variant="card">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Push Obavještenja (Pretraživač)
              </GlassCardTitle>
              <CardDescription>
                Primajte obavještenja o kašnjenju isporuka i drugim kritičnim događajima direktno na uređaju (Browser Push)
              </CardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Omogući obavještenja</h4>
                  <p className="text-sm text-muted-foreground">Aktuelan status: {pushEnabled ? "Omogućeno" : "Onemogućeno"}</p>
                </div>
                <Button 
                   variant={pushEnabled ? "secondary" : "default"} 
                   onClick={handlePushToggle} 
                   disabled={isSubscribing || pushEnabled}>
                   {isSubscribing ? "Omogućavanje..." : (pushEnabled ? "Omogućeno" : "Omogući")}
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
          <GlassCard variant="card">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                SMS obavještenja
              </GlassCardTitle>
              <CardDescription>
                Primajte kritična upozorenja o zalihama putem SMS-a kada materijali padnu ispod kritičnih pragova
              </CardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <Label htmlFor="phoneNumber">Broj telefona</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Unesite svoj broj telefona u međunarodnom formatu (npr. +1234567890)
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-primary/20">
                  <input
                    type="checkbox"
                    id="smsEnabled"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    disabled={isSaving}
                    className="h-4 w-4 rounded border-primary cursor-pointer"
                  />
                  <Label htmlFor="smsEnabled" className="cursor-pointer flex-1 m-0">
                    <span className="font-medium">Omogući SMS upozorenja</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Primaćete SMS obavještenja za kritične nivoe zaliha
                    </p>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Čuvam..." : "Sačuvaj podešavanja"}
                </Button>
              </form>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="card">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Kritični prag zaliha
              </GlassCardTitle>
              <CardDescription>
                Kako SMS upozorenja funkcioniraju
              </CardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-2">Nivoi upozorenja</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold">⚠️</span>
                    <span><strong>Niske zalihe:</strong> Količina materijala pada ispod minimalnog nivoa zaliha</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">🚨</span>
                    <span><strong>Kritične zalihe:</strong> Količina materijala pada ispod kritičnog praga (aktivira SMS)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Podešavanje kritičnih pragova</h4>
                <p className="text-muted-foreground">
                  Idite na stranicu Materijali i postavite "Kritični prag" za svaki materijal. Kada zalihe padnu ispod ovog nivoa, SMS upozorenja će biti poslana svim menedžerima sa omogućenim SMS obavještenjima.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Zahtjevi</h4>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Morate biti admin korisnik da biste primali SMS upozorenja</li>
                  <li>Broj telefona mora biti validan i u međunarodnom formatu</li>
                  <li>SMS obavještenja moraju biti omogućena u ovim podešavanjima</li>
                  <li>Materijal mora imati postavljenu vrijednost kritičnog praga</li>
                </ul>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
