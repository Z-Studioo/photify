// Event Canvas - Static Template Registry
// Templates ship as image assets under /public/templates/event-canvas/<occasion>
// and are declared here as a hardcoded list. Add new entries by dropping the
// JPG/PNG into /public and adding metadata below.

import type {
  EventCanvasOccasion,
  EventCanvasOccasionMeta,
  EventCanvasTemplate,
} from './types';

export const EVENT_CANVAS_OCCASIONS: EventCanvasOccasionMeta[] = [
  {
    id: 'birthday',
    label: 'Birthday',
    description: 'Celebrate milestones with a custom birthday banner',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    description: 'Welcome guests with a personalised wedding banner',
  },
  {
    id: 'engagement',
    label: 'Engagement',
    description: 'Mark the moment with a beautiful engagement design',
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    description: 'Honour the years with a tasteful anniversary banner',
  },
  {
    id: 'baby-shower',
    label: 'Baby Shower',
    description: 'Soft, joyful designs for the new arrival',
  },
  {
    id: 'graduation',
    label: 'Graduation',
    description: 'Celebrate the achievement with a graduation banner',
  },
];

/**
 * Standard 3:4 portrait canvas (matches every entry in `POSTER_SIZES`).
 * 1500x2000 keeps the editor responsive while still producing a print-quality
 * composite when exported.
 */
const TEMPLATE_W = 1500;
const TEMPLATE_H = 2000;

/**
 * Seed templates. Asset files should be added under
 * `app/public/templates/event-canvas/<occasion>/` matching the paths below.
 * Until real artwork is dropped in, the gallery will fall back to the
 * background path which can be a solid placeholder image.
 */
export const EVENT_CANVAS_TEMPLATES: EventCanvasTemplate[] = [
  // ── Birthday ────────────────────────────────────────────────────────────
  {
    id: 'birthday-classic-gold',
    name: 'Classic Gold',
    occasion: 'birthday',
    thumbnail: '/templates/event-canvas/birthday/classic-gold-thumb.jpg',
    background: '/templates/event-canvas/birthday/classic-gold.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'name',
        defaultText: 'Happy Birthday Sarah',
        x: 100,
        y: 220,
        width: 1300,
        height: 180,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 110,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        placeholder: 'Birthday name',
      },
      {
        id: 'age',
        defaultText: '30',
        x: 500,
        y: 760,
        width: 500,
        height: 360,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 320,
        fontWeight: 'bold',
        color: '#c9a86a',
        textAlign: 'center',
        placeholder: 'Age',
      },
      {
        id: 'date',
        defaultText: '15 May 2026',
        x: 100,
        y: 1740,
        width: 1300,
        height: 90,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 56,
        fontWeight: 'normal',
        color: '#555555',
        textAlign: 'center',
        placeholder: 'Date',
      },
    ],
    photoSlots: [
      {
        id: 'photo-main',
        x: 250,
        y: 1180,
        width: 1000,
        height: 480,
      },
    ],
  },
  {
    id: 'birthday-confetti-pop',
    name: 'Confetti Pop',
    occasion: 'birthday',
    thumbnail: '/templates/event-canvas/birthday/confetti-pop-thumb.jpg',
    background: '/templates/event-canvas/birthday/confetti-pop.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'headline',
        defaultText: "It's My Birthday!",
        x: 100,
        y: 160,
        width: 1300,
        height: 160,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 100,
        fontWeight: 'bold',
        color: '#f63a9e',
        textAlign: 'center',
      },
      {
        id: 'name',
        defaultText: 'Alex',
        x: 100,
        y: 1640,
        width: 1300,
        height: 160,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 120,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        placeholder: 'Name',
      },
    ],
    photoSlots: [
      {
        id: 'photo-portrait',
        x: 300,
        y: 380,
        width: 900,
        height: 1200,
      },
    ],
  },

  // ── Wedding ─────────────────────────────────────────────────────────────
  {
    id: 'wedding-elegant-script',
    name: 'Elegant Script',
    occasion: 'wedding',
    thumbnail: '/templates/event-canvas/wedding/elegant-script-thumb.jpg',
    background: '/templates/event-canvas/wedding/elegant-script.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'couple',
        defaultText: 'Emma & James',
        x: 100,
        y: 260,
        width: 1300,
        height: 220,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 140,
        fontStyle: 'italic',
        color: '#2c2c2c',
        textAlign: 'center',
        placeholder: 'Couple names',
      },
      {
        id: 'date',
        defaultText: 'June 14, 2026',
        x: 100,
        y: 1640,
        width: 1300,
        height: 90,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 56,
        color: '#6b6b6b',
        textAlign: 'center',
      },
      {
        id: 'venue',
        defaultText: 'The Old Mill, Cotswolds',
        x: 100,
        y: 1740,
        width: 1300,
        height: 80,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 44,
        color: '#8a8a8a',
        textAlign: 'center',
        placeholder: 'Venue',
      },
    ],
    photoSlots: [
      {
        id: 'photo-couple',
        x: 250,
        y: 540,
        width: 1000,
        height: 1020,
      },
    ],
  },
  {
    id: 'wedding-floral-arch',
    name: 'Floral Arch',
    occasion: 'wedding',
    thumbnail: '/templates/event-canvas/wedding/floral-arch-thumb.jpg',
    background: '/templates/event-canvas/wedding/floral-arch.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'welcome',
        defaultText: 'Welcome to our wedding',
        x: 100,
        y: 220,
        width: 1300,
        height: 120,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 64,
        color: '#5a5a5a',
        textAlign: 'center',
      },
      {
        id: 'couple',
        defaultText: 'Maya & Daniel',
        x: 100,
        y: 360,
        width: 1300,
        height: 200,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 130,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        placeholder: 'Couple names',
      },
      {
        id: 'date',
        defaultText: '12.09.2026',
        x: 100,
        y: 1760,
        width: 1300,
        height: 100,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 64,
        color: '#7a8a6a',
        textAlign: 'center',
      },
    ],
    photoSlots: [],
  },

  // ── Engagement ─────────────────────────────────────────────────────────
  {
    id: 'engagement-she-said-yes',
    name: 'She Said Yes',
    occasion: 'engagement',
    thumbnail: '/templates/event-canvas/engagement/she-said-yes-thumb.jpg',
    background: '/templates/event-canvas/engagement/she-said-yes.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'headline',
        defaultText: 'She said yes!',
        x: 100,
        y: 220,
        width: 1300,
        height: 200,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 130,
        fontStyle: 'italic',
        color: '#b8336a',
        textAlign: 'center',
      },
      {
        id: 'date',
        defaultText: '08.05.2026',
        x: 100,
        y: 1720,
        width: 1300,
        height: 100,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 60,
        color: '#5a5a5a',
        textAlign: 'center',
      },
    ],
    photoSlots: [
      {
        id: 'photo-main',
        x: 250,
        y: 480,
        width: 1000,
        height: 1140,
      },
    ],
  },

  // ── Anniversary ────────────────────────────────────────────────────────
  {
    id: 'anniversary-years-of-us',
    name: 'Years of Us',
    occasion: 'anniversary',
    thumbnail: '/templates/event-canvas/anniversary/years-of-us-thumb.jpg',
    background: '/templates/event-canvas/anniversary/years-of-us.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'years',
        defaultText: '25',
        x: 100,
        y: 240,
        width: 1300,
        height: 360,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 320,
        fontWeight: 'bold',
        color: '#c9a86a',
        textAlign: 'center',
        placeholder: 'Years',
      },
      {
        id: 'subtitle',
        defaultText: 'Years of love',
        x: 100,
        y: 620,
        width: 1300,
        height: 100,
        fontFamily: 'Mona Sans, sans-serif',
        fontStyle: 'italic',
        fontSize: 64,
        color: '#5a5a5a',
        textAlign: 'center',
      },
      {
        id: 'couple',
        defaultText: 'Anna & Robert',
        x: 100,
        y: 1640,
        width: 1300,
        height: 160,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 110,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        placeholder: 'Couple',
      },
    ],
    photoSlots: [
      {
        id: 'photo-couple',
        x: 300,
        y: 800,
        width: 900,
        height: 760,
      },
    ],
  },

  // ── Baby Shower ────────────────────────────────────────────────────────
  {
    id: 'baby-shower-little-one',
    name: 'Little One',
    occasion: 'baby-shower',
    thumbnail: '/templates/event-canvas/baby-shower/little-one-thumb.jpg',
    background: '/templates/event-canvas/baby-shower/little-one.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'headline',
        defaultText: 'Welcome little one',
        x: 100,
        y: 240,
        width: 1300,
        height: 200,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 110,
        fontWeight: 'bold',
        color: '#7a9bb8',
        textAlign: 'center',
      },
      {
        id: 'name',
        defaultText: 'Baby Olivia',
        x: 100,
        y: 1640,
        width: 1300,
        height: 160,
        fontFamily: 'Bricolage Grotesque, serif',
        fontStyle: 'italic',
        fontSize: 90,
        color: '#1a1a1a',
        textAlign: 'center',
        placeholder: 'Baby name',
      },
      {
        id: 'date',
        defaultText: 'Arriving June 2026',
        x: 100,
        y: 1800,
        width: 1300,
        height: 80,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 48,
        color: '#7a7a7a',
        textAlign: 'center',
      },
    ],
    photoSlots: [],
  },

  // ── Graduation ─────────────────────────────────────────────────────────
  {
    id: 'graduation-class-of',
    name: 'Class Of',
    occasion: 'graduation',
    thumbnail: '/templates/event-canvas/graduation/class-of-thumb.jpg',
    background: '/templates/event-canvas/graduation/class-of.jpg',
    canvasWidth: TEMPLATE_W,
    canvasHeight: TEMPLATE_H,
    aspectRatio: '3:4',
    editableTexts: [
      {
        id: 'class-label',
        defaultText: 'Class of',
        x: 100,
        y: 220,
        width: 1300,
        height: 130,
        fontFamily: 'Mona Sans, sans-serif',
        fontSize: 84,
        color: '#5a5a5a',
        textAlign: 'center',
      },
      {
        id: 'year',
        defaultText: '2026',
        x: 100,
        y: 360,
        width: 1300,
        height: 320,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 280,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        placeholder: 'Year',
      },
      {
        id: 'name',
        defaultText: 'Jordan Smith',
        x: 100,
        y: 1700,
        width: 1300,
        height: 140,
        fontFamily: 'Bricolage Grotesque, serif',
        fontSize: 96,
        fontWeight: 'bold',
        color: '#b8336a',
        textAlign: 'center',
        placeholder: 'Graduate name',
      },
    ],
    photoSlots: [
      {
        id: 'photo-grad',
        x: 350,
        y: 760,
        width: 800,
        height: 880,
      },
    ],
  },
];

export function getTemplatesByOccasion(): Record<
  EventCanvasOccasion,
  EventCanvasTemplate[]
> {
  return EVENT_CANVAS_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.occasion]) {
        acc[template.occasion] = [];
      }
      acc[template.occasion].push(template);
      return acc;
    },
    {} as Record<EventCanvasOccasion, EventCanvasTemplate[]>
  );
}

export function getTemplateById(id: string): EventCanvasTemplate | undefined {
  return EVENT_CANVAS_TEMPLATES.find(t => t.id === id);
}

export type {
  EventCanvasTemplate,
  EventCanvasOccasion,
  EventCanvasOccasionMeta,
  TextSlot,
  TemplatePhotoSlot,
} from './types';
