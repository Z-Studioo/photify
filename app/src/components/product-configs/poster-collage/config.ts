// Poster Collage Creator - Configuration Constants
// For wedding/event posters displayed on canvas stands
// Simple upload-based flow (no editing interface)

export const POSTER_COLLAGE_PRODUCT = {
  id: 'poster-collage',
  slug: 'poster-collage',
  name: 'Poster Collage for Events',
  type: 'canvas' as const,
  description: 'Upload your event poster design - perfect for weddings, birthdays, and celebrations on canvas stands',
  
  // Configuration settings
  config: {
    // Validation rules
    validation: {
      maxFileSize: 25, // MB (larger for poster designs)
      allowedFormats: ['image/jpeg', 'image/png', 'image/pdf', 'image/webp'],
    },
  }
};

// Standard poster sizes (portrait orientation for easel stands)
export const POSTER_SIZES = [
  { 
    width: 18, 
    height: 24, 
    label: '18" × 24"', 
    description: 'Small poster - Perfect for table signs',
    aspectRatio: 18/24
  },
  { 
    width: 24, 
    height: 36, 
    label: '24" × 36"', 
    description: 'Standard poster - Most popular for weddings',
    aspectRatio: 24/36,
    recommended: true
  },
  { 
    width: 30, 
    height: 40, 
    label: '30" × 40"', 
    description: 'Large poster - Great for seating charts',
    aspectRatio: 30/40
  },
  { 
    width: 36, 
    height: 48, 
    label: '36" × 48"', 
    description: 'Extra large poster - Maximum visibility',
    aspectRatio: 36/48
  },
];

// Default poster size (24" × 36" - most popular for weddings)
export const DEFAULT_POSTER_SIZE = POSTER_SIZES.find(s => s.recommended) || POSTER_SIZES[1];

// WhatsApp contact for design service
export const WHATSAPP_DESIGN_SERVICE = {
  phoneNumber: '+1234567890', // TODO: Replace with actual WhatsApp business number
  message: encodeURIComponent(
    'Hi! I need help designing a custom poster for my event. Can you help?'
  ),
  url: function() {
    return `https://wa.me/${this.phoneNumber}?text=${this.message}`;
  }
};
