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
        title: 'Room View',
        content: <>{'Preview your art in a realistic room setup.'}</>,
        selector: '[data-tour="room-view-btn"]',
        side: 'bottom',
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
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 2,
        pointerRadius: 4,
      },
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
        side: 'right',
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
        side: 'left',
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
        side: 'left',
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
        selector: '[data-tour="feature-size-crop"]',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Shape Selection',
        content: <>{'Pick between rectangle, square, circle, and more.'}</>,
        selector: '[data-tour="feature-shapes"]',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Edge Style',
        content: (
          <>{'Choose wrapped or mirrored edges for that clean finish.'}</>
        ),
        selector: '[data-tour="feature-edges"]',
        side: 'left',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      {
        icon: <></>,
        title: 'Quantity & Checkout',
        content: (
          <>{'Adjust how many you want and review before confirming.'}</>
        ),
        selector: '[data-tour="quantity-section"]',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },
      // {
      //   icon: <>◀️</>,
      //   title: 'Back to Features',
      //   content: <>{'Go back here if you want to tweak something.'}</>,
      //   selector: '[data-tour="feature-back-btn"]',
      //   side: 'right',
      //   showControls: true,
      //   showSkip: true,
      //   pointerPadding: 4,
      //   pointerRadius: 6,
      // },
      {
        icon: <></>,
        title: 'Apply Changes',
        content: <>{'Click on Comfirm Changes to apply updates instantly.'}</>,
        selector: '[data-tour="apply-changes-btn"]',
        side: 'top',
        showControls: true,
        showSkip: true,
        pointerPadding: 4,
        pointerRadius: 6,
      },

      // 🎉 Done
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
