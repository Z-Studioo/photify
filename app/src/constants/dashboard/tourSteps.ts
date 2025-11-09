import type { TourStep } from '@/components/shared/dashboard/TourGuide';

export const dashboardTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Photo Editor! 🎨',
    description:
      'Let us show you around! This quick tour will help you understand how to customize your photo prints.',
  },
  {
    id: 'add-image',
    title: 'Add Your Image',
    description:
      'Click the "Add Image" button to upload your photo. You can also change the background wall image to see how your print will look in different settings.',
  },
  {
    id: 'view-modes',
    title: 'Switch Between Views',
    description:
      'Toggle between Room View to see your photo in context, or 3D View to examine the print details up close. You can interact with the 3D model by dragging.',
  },
  {
    id: 'customize-features',
    title: 'Customize Your Print',
    description:
      'Use the sidebar features to select photo size, adjust crop ratio, choose edge appearance, and optimize image quality. Each option updates your preview in real-time.',
  },
  {
    id: 'side-appearance',
    title: 'Edge Appearance Options',
    description:
      'Choose between wrapped edges (image extends around sides) or mirrored edges (sides show a mirrored reflection) to perfect your print.',
  },
  {
    id: 'image-optimization',
    title: 'Optimize Image Quality',
    description:
      'Use the image optimization feature to enhance your photo quality. Compare before and after versions to get the perfect result.',
  },
  {
    id: 'quantity-confirm',
    title: 'Add to Cart',
    description:
      'Adjust the quantity and click "CONFIRM CHANGES" to finalize your customization. Your pricing updates automatically based on your selections.',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description:
      'You can restart this tour anytime by clicking the help icon in the navigation bar. Happy creating!',
  },
];
