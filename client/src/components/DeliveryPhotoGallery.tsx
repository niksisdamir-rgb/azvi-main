import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { format } from 'date-fns';

interface Photo {
  url: string;
  type: string;
  timestamp: string;
}

export function DeliveryPhotoGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi && open) {
      emblaApi.scrollTo(selectedIndex, true);
    }
  }, [open, selectedIndex, emblaApi]);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, idx) => (
          <div 
            key={idx} 
            className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer shadow-lg hover:border-orange-500/50 transition-all duration-300"
            onClick={() => {
              setSelectedIndex(idx);
              setOpen(true);
            }}
          >
            <img 
              src={photo.url} 
              alt={photo.type}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-[10px] text-white/50 uppercase tracking-widest">{format(new Date(photo.timestamp), 'dd.MM.yyyy HH:mm')}</p>
              <p className="text-xs font-bold text-white capitalize">{photo.type.replace('_', ' ')}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-black/90 backdrop-blur-2xl border-white/10 p-0 overflow-hidden shadow-2xl">
          <div className="relative w-full aspect-video md:aspect-[21/9] bg-black">
            <div className="overflow-hidden h-full" ref={emblaRef}>
              <div className="flex h-full">
                {photos.map((photo, idx) => (
                  <div key={idx} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4">
                    <img 
                      src={photo.url} 
                      alt={photo.type}
                      className="max-h-full max-w-full object-contain shadow-2xl rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute top-4 left-4 flex flex-col gap-1 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Documentation Photo</span>
                <span className="text-sm font-bold text-white capitalize">{photos[selectedIndex]?.type.replace('_', ' ')}</span>
                <span className="text-[10px] text-orange-400 font-mono">{format(new Date(photos[selectedIndex]?.timestamp || Date.now()), 'dd.MM.yyyy HH:mm')}</span>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={scrollPrev}
                className="rounded-full bg-black/40 border border-white/20 hover:bg-orange-500 hover:text-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-white flex items-center gap-1">
                <span className="text-orange-400">{selectedIndex + 1}</span>
                <span className="text-white/20">/</span>
                <span>{photos.length}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={scrollNext}
                className="rounded-full bg-black/40 border border-white/20 hover:bg-orange-500 hover:text-white transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
