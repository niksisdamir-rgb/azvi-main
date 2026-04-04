/**
 * Design System Showcase Page
 * 
 * A comprehensive demonstration of the AzVirt Design System
 * following 21.dev methodologies and WCAG 2.1 AA standards.
 */

import * as React from 'react';
import { 
  motion, 
  AnimatePresence,
  useScroll,
  useTransform 
} from 'framer-motion';
import { 
  Check, 
  Copy, 
  Sparkles, 
  Zap, 
  Shield, 
  Accessibility,
  Palette,
  Type,
  Layers,
  MousePointer,
  Grid3X3,
  Eye,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  ChevronRight
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  // Tokens
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  
  // Animation components
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ScaleOnHover,
  ScrollReveal,
  AnimatedSpinner,
  
  // Accessibility components
  SkipLink,
  LiveRegion,
  VisuallyHidden,
  
  // Design system components
  GlassCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardDivider,
  CardBadge,
} from '@/design-system';

// =============================================================================
// SECTION HEADER COMPONENT
// =============================================================================

function SectionHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <ScrollReveal className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
      </div>
      <p className="text-white/60 text-lg max-w-2xl">{description}</p>
    </ScrollReveal>
  );
}

// =============================================================================
// COLOR PALETTE SECTION
// =============================================================================

function ColorPalette() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyColor = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  const colorGroups = [
    { name: 'Primary', colors: colors.primary },
    { name: 'Neutral', colors: colors.neutral },
  ];

  return (
    <section id="colors" className="py-16">
      <SectionHeader
        title="Color Palette"
        description="A cohesive color system using OKLCH color space for perceptually uniform colors with warm undertones."
        icon={Palette}
      />

      <StaggerContainer className="space-y-8">
        {colorGroups.map((group) => (
          <StaggerItem key={group.name}>
            <GlassCard variant="dark">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>
                  {group.name === 'Primary' 
                    ? 'Brand accent colors - Orange (#FF6C0E) based'
                    : 'Neutral scale - Warm gray for UI elements'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
                  {Object.entries(group.colors).map(([name, value]) => (
                    <ScaleOnHover key={name}>
                      <button
                        onClick={() => copyColor(value, `${group.name}-${name}`)}
                        className="group relative aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
                        style={{ backgroundColor: value }}
                        aria-label={`Copy ${group.name} ${name}: ${value}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                          {copied === `${group.name}-${name}` ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <Copy className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-1 text-[10px] font-mono text-center bg-black/60 text-white/90">
                          {name}
                        </div>
                      </button>
                    </ScaleOnHover>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </StaggerItem>
        ))}

        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Semantic Colors</CardTitle>
              <CardDescription>Status and feedback colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colors.semantic).map(([name, values]) => (
                  <div key={name} className="space-y-2">
                    <h4 className="text-sm font-medium capitalize text-white/80">{name}</h4>
                    <div className="space-y-1">
                      {Object.entries(values).map(([shade, value]) => (
                        <div
                          key={shade}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: value }}
                          />
                          <span className="text-white/60 font-mono">{shade}</span>
                          <span className="text-white/40">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// TYPOGRAPHY SECTION
// =============================================================================

function TypographySection() {
  const typeScale = [
    { name: 'Hero', class: 'text-6xl font-bold', sample: 'Aa' },
    { name: 'H1', class: 'text-5xl font-bold', sample: 'Heading 1' },
    { name: 'H2', class: 'text-4xl font-semibold', sample: 'Heading 2' },
    { name: 'H3', class: 'text-3xl font-semibold', sample: 'Heading 3' },
    { name: 'H4', class: 'text-2xl font-semibold', sample: 'Heading 4' },
    { name: 'H5', class: 'text-xl font-semibold', sample: 'Heading 5' },
    { name: 'H6', class: 'text-lg font-semibold', sample: 'Heading 6' },
    { name: 'Body', class: 'text-base', sample: 'Body text is the main content text.' },
    { name: 'Small', class: 'text-sm', sample: 'Small text for captions and labels.' },
    { name: 'Caption', class: 'text-xs', sample: 'Caption text.' },
  ];

  return (
    <section id="typography" className="py-16">
      <SectionHeader
        title="Typography"
        description="A typographic scale using the Major Third (1.25) ratio for harmonious proportions."
        icon={Type}
      />

      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Type Scale</CardTitle>
              <CardDescription>
                Font: Rethink Sans | Base: 16px (1rem) | Scale: 1.25
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {typeScale.map((item) => (
                  <div key={item.name} className="flex items-baseline gap-4 pb-4 border-b border-white/10 last:border-0">
                    <span className="w-20 text-sm text-white/50 font-mono">{item.name}</span>
                    <span className={cn('text-white', item.class)}>
                      {item.sample}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Font Weights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                  <div key={weight} className="flex items-center gap-4">
                    <span className="w-12 text-sm text-white/50 font-mono">{weight}</span>
                    <span 
                      className="text-xl text-white"
                      style={{ fontWeight: weight }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// SPACING SECTION
// =============================================================================

function SpacingSection() {
  const spacingValues = [
    { name: 'xs', value: '0.25rem', px: '4px' },
    { name: 'sm', value: '0.5rem', px: '8px' },
    { name: 'md', value: '1rem', px: '16px' },
    { name: 'lg', value: '1.5rem', px: '24px' },
    { name: 'xl', value: '2rem', px: '32px' },
    { name: '2xl', value: '3rem', px: '48px' },
    { name: '3xl', value: '4rem', px: '64px' },
  ];

  return (
    <section id="spacing" className="py-16">
      <SectionHeader
        title="Spacing"
        description="8-point grid system for consistent spacing throughout the interface."
        icon={Grid3X3}
      />

      <StaggerContainer>
        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <CardDescription>Base unit: 4px (0.25rem)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spacingValues.map((space) => (
                  <div key={space.name} className="flex items-center gap-4">
                    <span className="w-16 text-sm text-white/50 font-mono">{space.name}</span>
                    <div className="flex-1 flex items-center gap-4">
                      <div
                        className="h-8 bg-primary/50 rounded"
                        style={{ width: space.value }}
                      />
                      <span className="text-sm text-white/60 font-mono">{space.value}</span>
                      <span className="text-sm text-white/40">({space.px})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// SHADOWS & ELEVATION SECTION
// =============================================================================

function ShadowsSection() {
  const shadowExamples = [
    { name: 'None', class: 'shadow-none' },
    { name: 'Flat SM', class: 'shadow-sm' },
    { name: 'Flat', class: 'shadow' },
    { name: 'Flat MD', class: 'shadow-md' },
    { name: 'Flat LG', class: 'shadow-lg' },
    { name: 'Flat XL', class: 'shadow-xl' },
    { name: 'Flat 2XL', class: 'shadow-2xl' },
  ];

  return (
    <section id="shadows" className="py-16">
      <SectionHeader
        title="Shadows & Elevation"
        description="Elevation system for creating depth and hierarchy."
        icon={Layers}
      />

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {shadowExamples.map((shadow) => (
          <StaggerItem key={shadow.name}>
            <GlassCard variant="light" hover className={shadow.class}>
              <CardContent className="p-6 flex items-center justify-center h-24">
                <span className="text-sm text-white/80">{shadow.name}</span>
              </CardContent>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// COMPONENTS SECTION
// =============================================================================

function ComponentsSection() {
  return (
    <section id="components" className="py-16">
      <SectionHeader
        title="Components"
        description="Reusable UI components with glass morphism styling."
        icon={Layers}
      />

      <StaggerContainer className="space-y-8">
        {/* Glass Card Variants */}
        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Glass Card Variants</CardTitle>
              <CardDescription>Different visual treatments for cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard variant="default" hover>
                  <CardContent className="p-4">
                    <p className="text-sm text-white/80">Default</p>
                  </CardContent>
                </GlassCard>
                <GlassCard variant="dark" hover>
                  <CardContent className="p-4">
                    <p className="text-sm text-white/80">Dark</p>
                  </CardContent>
                </GlassCard>
                <GlassCard variant="light" hover>
                  <CardContent className="p-4">
                    <p className="text-sm text-white/80">Light</p>
                  </CardContent>
                </GlassCard>
                <GlassCard variant="elevated" hover glow>
                  <CardContent className="p-4">
                    <p className="text-sm text-white/80">Elevated + Glow</p>
                  </CardContent>
                </GlassCard>
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>

        {/* Card with Structure */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard variant="dark" hover>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Complete Card</CardTitle>
                  <CardBadge variant="primary">New</CardBadge>
                </div>
                <CardDescription>
                  Cards support headers, content, footers, and badges.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  This is the main content area where you can place any information,
                  forms, or other components.
                </p>
              </CardContent>
              <CardDivider />
              <CardFooter className="justify-between">
                <span className="text-sm text-white/50">Footer content</span>
                <Button size="sm">Action</Button>
              </CardFooter>
            </GlassCard>

            <GlassCard variant="elevated" glow>
              <CardHeader>
                <CardTitle>Feature Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Zap, text: 'Performance optimized' },
                  { icon: Accessibility, text: 'WCAG 2.1 AA compliant' },
                  { icon: Shield, text: 'Type-safe with TypeScript' },
                  { icon: Sparkles, text: 'Beautiful micro-interactions' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-white/80">{text}</span>
                  </div>
                ))}
              </CardContent>
            </GlassCard>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// ANIMATIONS SECTION
// =============================================================================

function AnimationsSection() {
  const [showAnimation, setShowAnimation] = React.useState(true);

  return (
    <section id="animations" className="py-16">
      <SectionHeader
        title="Animations"
        description="Micro-interactions and transitions for delightful user experiences."
        icon={MousePointer}
      />

      <StaggerContainer className="space-y-8">
        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Animation Variants</CardTitle>
                  <CardDescription>Reusable animation presets</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAnimation(false);
                    setTimeout(() => setShowAnimation(true), 100);
                  }}
                >
                  Replay
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showAnimation && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FadeIn delay={0}>
                      <div className="p-4 bg-primary/20 rounded-lg text-center">
                        <p className="text-sm text-white/80">Fade In</p>
                      </div>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.1}>
                      <div className="p-4 bg-primary/20 rounded-lg text-center">
                        <p className="text-sm text-white/80">Fade Up</p>
                      </div>
                    </FadeIn>
                    <FadeIn direction="left" delay={0.2}>
                      <div className="p-4 bg-primary/20 rounded-lg text-center">
                        <p className="text-sm text-white/80">Fade Left</p>
                      </div>
                    </FadeIn>
                    <FadeIn direction="right" delay={0.3}>
                      <div className="p-4 bg-primary/20 rounded-lg text-center">
                        <p className="text-sm text-white/80">Fade Right</p>
                      </div>
                    </FadeIn>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="dark">
              <CardHeader>
                <CardTitle>Scale on Hover</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScaleOnHover>
                  <div className="p-4 bg-white/10 rounded-lg text-center">
                    <p className="text-sm text-white/80">Hover me</p>
                  </div>
                </ScaleOnHover>
                <ScaleOnHover scale={1.05}>
                  <div className="p-4 bg-primary/20 rounded-lg text-center">
                    <p className="text-sm text-white/80">Scale 1.05</p>
                  </div>
                </ScaleOnHover>
              </CardContent>
            </GlassCard>

            <GlassCard variant="dark">
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-6">
                <AnimatedSpinner size="sm" />
                <AnimatedSpinner size="md" />
                <AnimatedSpinner size="lg" />
              </CardContent>
            </GlassCard>

            <GlassCard variant="dark">
              <CardHeader>
                <CardTitle>Interactive Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full group">
                  <span>Hover for animation</span>
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex gap-2">
                  <Badge variant="default" className="animate-pulse">Live</Badge>
                  <Badge variant="secondary">Static</Badge>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// ACCESSIBILITY SECTION
// =============================================================================

function AccessibilitySection() {
  return (
    <section id="accessibility" className="py-16">
      <SectionHeader
        title="Accessibility"
        description="WCAG 2.1 AA compliant components and utilities."
        icon={Accessibility}
      />

      <StaggerContainer className="space-y-8">
        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Focus Management</CardTitle>
              <CardDescription>Visible focus indicators for keyboard navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/60">
                Use Tab key to navigate through these elements:
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline">Focusable Button</Button>
                <Button variant="outline">Another Button</Button>
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-white/20 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
                  onClick={(e) => e.preventDefault()}
                >
                  Focusable Link
                </a>
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard variant="dark">
              <CardHeader>
                <CardTitle>Screen Reader Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/80">
                    Email Address
                    <span className="text-destructive ml-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-required="true"
                    aria-describedby="email-help"
                  />
                  <p id="email-help" className="text-xs text-white/50">
                    We'll never share your email with anyone else.
                  </p>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard variant="dark">
              <CardHeader>
                <CardTitle>Status Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Success message example</span>
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Error message example</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Info message example</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Warning message example</span>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </StaggerItem>

        <StaggerItem>
          <GlassCard variant="dark">
            <CardHeader>
              <CardTitle>Accessibility Features Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'WCAG 2.1 AA Compliant',
                  'Keyboard Navigation Support',
                  'Screen Reader Compatible',
                  'High Contrast Mode Support',
                  'Reduced Motion Support',
                  'Focus Visible Indicators',
                  'Semantic HTML Structure',
                  'ARIA Labels & Descriptions',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}

// =============================================================================
// HERO SECTION
// =============================================================================

function Hero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const y = useTransform(scrollY, [0, 200], [0, 50]);

  return (
    <motion.section
      style={{ opacity, y }}
      className="relative py-24 md:py-32 text-center"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">21.dev Methodologies</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
        >
          AzVirt Design System
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-8"
        >
          A sophisticated, accessible, and performant design system built with 
          modern technologies and WCAG 2.1 AA compliance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button size="lg" className="gap-2">
            <Eye className="w-4 h-4" />
            Explore Components
          </Button>
          <Button variant="outline" size="lg">
            Documentation
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-white/40"
        >
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            TypeScript Ready
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            WCAG 2.1 AA
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            Framer Motion
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            Tailwind CSS
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
}

// =============================================================================
// NAVIGATION
// =============================================================================

function Navigation() {
  const sections = [
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'shadows', label: 'Shadows' },
    { id: 'components', label: 'Components' },
    { id: 'animations', label: 'Animations' },
    { id: 'accessibility', label: 'Accessibility' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 py-4 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <SkipLink />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">Design System</span>
          
          <div className="hidden md:flex items-center gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v1.0</Badge>
          </div>
        </div>
      </div>
    </nav>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Hero />
        
        <div className="space-y-8">
          <ColorPalette />
          <TypographySection />
          <SpacingSection />
          <ShadowsSection />
          <ComponentsSection />
          <AnimationsSection />
          <AccessibilitySection />
        </div>
      </main>

      <footer className="border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © 2026 AzVirt Design System. Built with 21.dev methodologies.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
