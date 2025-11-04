import type { Tour } from 'nextstepjs';

export const dashboardSteps: Tour[] = [
  {
    tour: 'dashboard-tour',
    steps: [
      {
        icon: <>👋</>,
        title: 'Welcome to Your Photify Canvas Studio!',
        content: (
          <>
            {
              "Create stunning photo prints under acrylic glass with complete customization. Let's show you around!"
            }
          </>
        ),
        selector: 'body',
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 0,
      },

      // 🚀 Start prompt
      {
        icon: <>🚀</>,
        title: 'Quick Tour Time!',
        content: (
          <>
            {
              'We’ll walk you through all the main features. Click Next for the guide or Skip to explore yourself.'
            }
          </>
        ),
        selector: 'body',
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 0,
      },

      // 🎯 Main buttons

      {
        icon: <></>,
        title: 'Add Custom Background',
        content: (
          <>
            {
              'Upload your own wall photo to preview your print in your real space.'
            }
          </>
        ),
        selector: '[data-tour="add-image-btn"]',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        pointerPadding: 2,
        pointerRadius: 4,
      },
      {
        icon: <></>,
        title: 'Room View',
        content: <>{'Preview your art in a realistic room setup.'}</>,
        selector: '[data-tour="room-view-btn"]',
        side: 'bottom-right',
        showControls: true,
        showSkip: true,
        pointerPadding: 2,
        pointerRadius: 4,
      },
      {
        icon: <></>,
        title: '3D View',
        content: <>{'Explore your canvas from every angle in 3D!'}</>,
        selector: '[data-tour="3d-view-btn"]',
        side: 'bottom-right',
        showControls: true,
        showSkip: true,
        pointerPadding: 2,
        pointerRadius: 4,
      },

      // ⚙️ Feature panel
      {
        icon: <></>,
        title: 'Features Panel',
        content: <>{'Adjust sizes, shapes, and edge styles from here.'}</>,
        selector: '[data-tour="features-list"]',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Select Photo',
        content: <>{'Click here to upload your images.'}</>,
        selector: '[data-tour="feature-select-photo"]',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Size & Crop',
        content: (
          <>{'Choose your canvas size and crop your photo to fit perfectly.'}</>
        ),
        selector: '[data-tour="feature-image-size-and-crop-photo"]',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Side Appearance',
        content: (
          <>{'Pick between wrapped or mirrored edge for your canvas.'}</>
        ),
        selector: '[data-tour="feature-side-appearance"]',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Image Optimization',
        content: <>{'Enhance the quality of your image.'}</>,
        selector: '[data-tour="feature-image-optimization"]',
        side: 'right',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },

      {
        icon: <></>,
        title: 'Quantity Section',
        content: <>{'Adjust the total number of canvases.'}</>,
        selector: '[data-tour="quantity-section"]',
        side: 'top-left',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },

      {
        icon: <></>,
        title: 'Apply Changes',
        content: (
          <>{'Use this button to apply all your changes and features.'}</>
        ),
        selector: '[data-tour="confirm-changes"]',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },

      {
        icon: <>🎉</>,
        title: "You're All Set!",
        content: <>{'Now you’re ready to design your masterpiece!'}</>,
        selector: 'body',
        showControls: true,
        showSkip: false,
        pointerPadding: 0,
        pointerRadius: 0,
      },
    ],
  },
];
