import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Trash2, Loader2, Crop, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  type CollagePhoto,
  type CollageTemplate,
  type GridConfig,
  type FixedSlotsConfig,
} from './types';
import { inchesToPixels } from './config';
import { CropModal } from './crop-modal';

interface CollageEditorProps {
  width: number;
  height: number;
  backgroundColor: string;
  photos: CollagePhoto[];
  template: CollageTemplate | null;
  onPhotosChange: (photos: CollagePhoto[]) => void;
  onCanvasUpdate?: (dataURL: string) => void;
  onOpenPhotoModal?: (
    slotInfo: {
      slotId: string | null;
      targetSlot: { x: number; y: number; width: number; height: number };
    },
    photoSelectedCallback: (
      photo: CollagePhoto,
      slotInfo: {
        slotId: string | null;
        targetSlot: { x: number; y: number; width: number; height: number };
      }
    ) => void
  ) => void;
}

export function CollageEditor({
  width,
  height,
  backgroundColor,
  photos,
  template,
  onPhotosChange,
  onCanvasUpdate,
  onOpenPhotoModal,
}: CollageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<'image' | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewportScale, setViewportScale] = useState(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{
    photo: CollagePhoto;
    slotId: string | null;
    targetSlot: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [pendingSlotForUpload, setPendingSlotForUpload] = useState<{
    slotId: string | null;
    targetSlot: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const slotUploadInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID (mobile-compatible fallback)
  const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for browsers that don't support crypto.randomUUID (some mobile browsers)
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Calculate viewport scale to fit canvas
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const canvasWidth = inchesToPixels(width);
      const canvasHeight = inchesToPixels(height);

      // Get available space (container minus padding and controls)
      const container = containerRef.current;
      const availableWidth = container.clientWidth - 64; // 32px padding on each side
      const availableHeight = container.clientHeight - 160; // Space for toolbars and padding

      // Calculate scale to fit both dimensions
      const scaleX = availableWidth / canvasWidth;
      const scaleY = availableHeight / canvasHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Never scale up, only down

      console.log('Viewport scale calculation:', {
        canvasSize: { width: canvasWidth, height: canvasHeight },
        available: { width: availableWidth, height: availableHeight },
        scales: { scaleX, scaleY },
        finalScale: scale,
      });

      setViewportScale(scale);
    };

    calculateScale();

    // Recalculate on window resize
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  // Initialize canvas once on mount
  useEffect(() => {
    if (!canvasRef.current) {
      console.log('Canvas ref not available yet');
      return;
    }

    // Prevent double initialization
    if (fabricCanvasRef.current) {
      console.log('Canvas already initialized, skipping');
      return;
    }

    const canvasWidth = inchesToPixels(width);
    const canvasHeight = inchesToPixels(height);

    console.log('Initializing Fabric canvas:', canvasWidth, 'x', canvasHeight);

    // Set canvas element attributes explicitly
    canvasRef.current.width = canvasWidth;
    canvasRef.current.height = canvasHeight;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: backgroundColor,
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    fabricCanvasRef.current = fabricCanvas;
    console.log('Fabric canvas initialized successfully');
    console.log(
      'Canvas element dimensions:',
      canvasRef.current.width,
      'x',
      canvasRef.current.height
    );
    console.log(
      'Fabric canvas dimensions:',
      fabricCanvas.width,
      'x',
      fabricCanvas.height
    );

    setIsLoading(false);

    fabricCanvas.on('selection:created', (e: any) => {
      if (e.selected && e.selected[0]) {
        const obj = e.selected[0];
        const instanceId = (obj as any).data?.instanceId || null;
        setSelectedObjectId(instanceId);
        setSelectedObjectType('image');
      }
    });

    fabricCanvas.on('selection:updated', (e: any) => {
      if (e.selected && e.selected[0]) {
        const obj = e.selected[0];
        const instanceId = (obj as any).data?.instanceId || null;
        setSelectedObjectId(instanceId);
        setSelectedObjectType('image');
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    });

    fabricCanvas.on('object:modified', () => {
      updatePhotosFromCanvas();
    });

    fabricCanvas.on('object:moving', () => {
      updatePhotosFromCanvas();
    });

    fabricCanvas.on('object:scaling', () => {
      updatePhotosFromCanvas();
    });

    fabricCanvas.on('object:rotating', () => {
      updatePhotosFromCanvas();
    });

    return () => {
      console.log('Disposing canvas and cleaning up event listeners');
      // Remove all event listeners before disposing
      fabricCanvas.off('selection:created');
      fabricCanvas.off('selection:updated');
      fabricCanvas.off('selection:cleared');
      fabricCanvas.off('object:modified');
      fabricCanvas.off('object:moving');
      fabricCanvas.off('object:scaling');
      fabricCanvas.off('object:rotating');
      fabricCanvas.off('mouse:up');

      // Dispose of all objects
      fabricCanvas.getObjects().forEach(obj => {
        fabricCanvas.remove(obj);
      });

      // Dispose canvas
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []); // Only run once on mount

  // Callback for when photo is selected from modal
  const handlePhotoSelectedFromModal = React.useCallback(
    (
      photo: CollagePhoto,
      slotInfo: {
        slotId: string | null;
        targetSlot: { x: number; y: number; width: number; height: number };
      }
    ) => {
      console.log('Photo selected from modal:', photo.id, slotInfo);

      // Open crop modal immediately with the selected photo and slot
      setPendingPhoto({
        photo,
        slotId: slotInfo.slotId,
        targetSlot: slotInfo.targetSlot,
      });
      setShowCropModal(true);
    },
    []
  );

  // Add canvas click handler for slot guides (separate effect to access handleSlotClick)
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    const handleCanvasClick = (e: any) => {
      const target = e.target;
      if (target && (target as any).data?.isGuide) {
        const slotData = (target as any).data;
        console.log('Guide clicked via canvas event:', slotData);

        // Open photo modal with slot info and callback
        if (onOpenPhotoModal) {
          console.log('Opening photo modal from canvas click');
          onOpenPhotoModal(
            { slotId: slotData.slotId, targetSlot: slotData.targetSlot },
            handlePhotoSelectedFromModal
          );
        }
      }
    };

    canvas.on('mouse:up', handleCanvasClick);

    return () => {
      canvas.off('mouse:up', handleCanvasClick);
    };
  }, [onOpenPhotoModal, handlePhotoSelectedFromModal]);

  // Handle canvas size changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvasWidth = inchesToPixels(width);
    const canvasHeight = inchesToPixels(height);

    console.log('Updating canvas size:', canvasWidth, 'x', canvasHeight);

    fabricCanvasRef.current.setDimensions({
      width: canvasWidth,
      height: canvasHeight,
    });
    fabricCanvasRef.current.renderAll();
  }, [width, height]);

  // Handle background color changes
  useEffect(() => {
    if (!fabricCanvasRef.current || isLoading) {
      console.log('Canvas not ready for background color update');
      return;
    }

    console.log('Updating background color to:', backgroundColor);
    fabricCanvasRef.current.backgroundColor = backgroundColor;
    fabricCanvasRef.current.renderAll();
    fabricCanvasRef.current.requestRenderAll();
  }, [backgroundColor, isLoading]);

  // Handle photo loading - only render placed photos
  useEffect(() => {
    if (!fabricCanvasRef.current) {
      console.log('No fabric canvas ref');
      return;
    }

    // Skip if canvas is still loading
    if (isLoading) {
      console.log('Canvas still initializing, skipping photo update');
      return;
    }

    const canvas = fabricCanvasRef.current;
    const placedPhotos = photos.filter(p => p.isPlaced);
    console.log(
      'Photos effect triggered, placed photos count:',
      placedPhotos.length
    );

    // Only sync if there's a mismatch between photos and canvas objects
    const existingObjects = canvas.getObjects();
    const existingInstanceIds = existingObjects
      .map((obj: any) => obj.data?.instanceId)
      .filter(Boolean);
    const newInstanceIds = placedPhotos.map(p => p.instanceId);

    const needsSync =
      existingInstanceIds.length !== newInstanceIds.length ||
      !existingInstanceIds.every(instanceId =>
        newInstanceIds.includes(instanceId)
      );

    if (!needsSync && placedPhotos.length > 0) {
      console.log('Photos already in sync with canvas, skipping');
      return;
    }

    console.log('Syncing canvas with placed photos...');
    setLoadingImages(true);

    // Clear existing image objects only
    existingObjects.forEach((obj: any) => {
      if (obj.data?.id) {
        canvas.remove(obj);
      }
    });

    canvas.renderAll();

    if (!placedPhotos.length) {
      console.log('No placed photos to load');
      setLoadingImages(false);
      return;
    }

    console.log('Starting to load', placedPhotos.length, 'placed photos');

    // Determine if template restricts movement
    const isFreeform = !template || template.type === 'freeform';

    // Load all placed photos
    const loadPromises = placedPhotos.map((photo, index) => {
      console.log(`Loading photo ${index + 1}:`, {
        id: photo.id,
        position: { x: photo.x, y: photo.y },
        size: { width: photo.width, height: photo.height },
        crop: {
          x: photo.cropX,
          y: photo.cropY,
          width: photo.cropWidth,
          height: photo.cropHeight,
        },
      });

      return fabric.FabricImage.fromURL(photo.url, {
        crossOrigin: 'anonymous',
      })
        .then(fabricImg => {
          console.log(
            `✓ Image ${index + 1} loaded successfully, dimensions:`,
            fabricImg.width,
            'x',
            fabricImg.height
          );

          // Apply crop if crop data exists
          if (
            photo.cropX !== undefined &&
            photo.cropY !== undefined &&
            photo.cropWidth !== undefined &&
            photo.cropHeight !== undefined
          ) {
            // Crop the image to the specified area
            fabricImg.set({
              cropX: photo.cropX,
              cropY: photo.cropY,
              width: photo.cropWidth,
              height: photo.cropHeight,
            });
            console.log(`✓ Applied crop to image ${index + 1}:`, {
              cropX: photo.cropX,
              cropY: photo.cropY,
              cropWidth: photo.cropWidth,
              cropHeight: photo.cropHeight,
            });
          }

          // Calculate scale to match desired size (after cropping)
          const imageWidth =
            photo.cropWidth !== undefined
              ? photo.cropWidth
              : fabricImg.width || 1;
          const imageHeight =
            photo.cropHeight !== undefined
              ? photo.cropHeight
              : fabricImg.height || 1;
          const scaleX = (photo.width || imageWidth) / imageWidth;
          const scaleY = (photo.height || imageHeight) / imageHeight;

          // Configure the fabric image with center origin
          fabricImg.set({
            left: photo.x || 0,
            top: photo.y || 0,
            scaleX: scaleX,
            scaleY: scaleY,
            originX: 'center', // Position from center, not top-left
            originY: 'center', // Position from center, not top-left
            angle: photo.rotation,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            borderColor: '#f63a9e',
            cornerColor: '#f63a9e',
            cornerSize: 12,
            transparentCorners: false,
            borderScaleFactor: 2,
            // Restrict controls based on template type
            lockMovementX: !isFreeform,
            lockMovementY: !isFreeform,
            lockScalingX: !isFreeform,
            lockScalingY: !isFreeform,
            lockRotation: false, // Always allow rotation
            // Show only rotation controls for non-freeform templates
            setControlsVisibility: !isFreeform
              ? {
                  mt: false, // middle top
                  mb: false, // middle bottom
                  ml: false, // middle left
                  mr: false, // middle right
                  tl: false, // top left
                  tr: false, // top right
                  bl: false, // bottom left
                  br: false, // bottom right
                  mtr: true, // rotation control only
                }
              : undefined,
          });

          // Store photo instance ID and slot info in the fabric object
          (fabricImg as any).data = {
            id: photo.id,
            instanceId: photo.instanceId,
            slotId: photo.slotId,
          };

          console.log(`✓ Fabric image ${index + 1} configured:`, {
            position: { x: photo.x, y: photo.y },
            scale: { x: scaleX, y: scaleY },
            finalSize: {
              width: imageWidth * scaleX,
              height: imageHeight * scaleY,
            },
            canvasSize: { width: canvas.width, height: canvas.height },
            locked: !isFreeform,
            cropped: photo.cropX !== undefined,
          });
          return fabricImg;
        })
        .catch(error => {
          console.error(`✗ Error loading image ${index + 1}:`, error);
          toast.error(`Failed to load image ${index + 1}`);
          return null;
        });
    });

    // Add all loaded images to canvas - use allSettled for better error handling
    Promise.allSettled(loadPromises)
      .then(results => {
        const validImages = results
          .filter(
            result => result.status === 'fulfilled' && result.value !== null
          )
          .map((result: any) => result.value);

        const failedCount = results.filter(
          r =>
            r.status === 'rejected' ||
            (r.status === 'fulfilled' && r.value === null)
        ).length;

        console.log(
          `✓ Images loaded: ${validImages.length}/${placedPhotos.length} successful${failedCount > 0 ? `, ${failedCount} failed` : ''}`
        );

        if (failedCount > 0) {
          toast.error(
            `${failedCount} image${failedCount > 1 ? 's' : ''} failed to load`,
            {
              description: 'Please try re-uploading the failed images',
            }
          );
        }

        validImages.forEach((img, index) => {
          if (img) {
            console.log(`✓ Adding image ${index + 1} to canvas`);
            canvas.add(img as any);
          }
        });

        console.log('✓ Canvas state:', {
          objectCount: canvas.getObjects().length,
          dimensions: `${canvas.width}x${canvas.height}`,
          backgroundColor: canvas.backgroundColor,
        });

        // Debug: Log each object's actual position and visibility
        canvas.getObjects().forEach((obj: any, idx) => {
          console.log(`Object ${idx + 1}:`, {
            visible: obj.visible,
            opacity: obj.opacity,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            originX: obj.originX,
            originY: obj.originY,
          });
        });

        canvas.renderAll();
        canvas.requestRenderAll(); // Force re-render
        setLoadingImages(false);
        console.log('✓ Canvas render complete');

        // Export canvas as data URL for 3D preview
        if (onCanvasUpdate && validImages.length > 0) {
          try {
            const dataURL = canvas.toDataURL({
              format: 'png',
              quality: 1.0,
              multiplier: 1,
            });
            onCanvasUpdate(dataURL);
            console.log('✓ Canvas exported for 3D preview');
          } catch (error) {
            console.error('✗ Failed to export canvas:', error);
            toast.error('Failed to generate preview');
          }
        }
      })
      .catch(error => {
        console.error('✗ Unexpected error in image loading:', error);
        setLoadingImages(false);
        toast.error('Unexpected error loading images');
      });
  }, [photos, isLoading, template]); // Add template to dependencies

  // Note: Removed auto-arrangement - users will drag photos to slots manually

  // Draw template guide overlays
  const drawTemplateGuides = () => {
    if (!fabricCanvasRef.current || !template || template.type === 'freeform') {
      return;
    }

    const canvas = fabricCanvasRef.current;
    const canvasWidth = inchesToPixels(width);
    const canvasHeight = inchesToPixels(height);

    // Remove existing guide rectangles
    canvas.getObjects().forEach((obj: any) => {
      if (obj.data?.isGuide) {
        canvas.remove(obj);
      }
    });

    if (template.type === 'grid') {
      const config = template.config as GridConfig;
      const { rows, columns, spacing, padding } = config;

      const availableWidth =
        canvasWidth - 2 * padding - (columns - 1) * spacing;
      const availableHeight = canvasHeight - 2 * padding - (rows - 1) * spacing;
      const slotWidth = availableWidth / columns;
      const slotHeight = availableHeight / rows;

      // Draw slot guides only for empty slots
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const slotId = `slot-${row}-${col}`;

          // Check if this slot is occupied by a photo
          const isOccupied = photos.some(
            p => p.isPlaced && p.slotId === slotId
          );

          // Only draw guide if slot is empty
          if (!isOccupied) {
            const x = padding + col * (slotWidth + spacing);
            const y = padding + row * (slotHeight + spacing);

            // Create a group with rectangle and text for better click handling
            const rect = new fabric.Rect({
              left: 0,
              top: 0,
              width: slotWidth,
              height: slotHeight,
              fill: 'rgba(246, 58, 158, 0.05)', // Light pink fill for visibility
              stroke: '#d1d5db',
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              originX: 'left',
              originY: 'top',
            });

            const plusText = new fabric.Text('+', {
              left: slotWidth / 2,
              top: slotHeight / 2,
              fontSize: Math.min(slotWidth, slotHeight) * 0.3,
              fill: '#f63a9e',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              originX: 'center',
              originY: 'center',
              opacity: 0.6,
            });

            const slotGroup = new fabric.Group([rect, plusText], {
              left: x,
              top: y,
              selectable: false,
              evented: true,
              hoverCursor: 'pointer',
            });

            (slotGroup as any).data = {
              isGuide: true,
              slotId,
              targetSlot: {
                x: x + slotWidth / 2,
                y: y + slotHeight / 2,
                width: slotWidth - 10,
                height: slotHeight - 10,
              },
            };

            // Click handler is managed at canvas level for better browser compatibility
            canvas.add(slotGroup);
            canvas.sendObjectToBack(slotGroup);
          }
        }
      }
    } else if (template.type === 'fixed-slots') {
      const config = template.config as FixedSlotsConfig;
      const { slots } = config;

      slots.forEach(slot => {
        // Check if this slot is occupied by a photo
        const isOccupied = photos.some(p => p.isPlaced && p.slotId === slot.id);

        // Only draw guide if slot is empty
        if (!isOccupied) {
          // Create a group with rectangle and text for better click handling
          const rect = new fabric.Rect({
            left: 0,
            top: 0,
            width: slot.width,
            height: slot.height,
            fill: 'rgba(246, 58, 158, 0.05)', // Light pink fill for visibility
            stroke: '#d1d5db',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            originX: 'left',
            originY: 'top',
          });

          const plusText = new fabric.Text('+', {
            left: slot.width / 2,
            top: slot.height / 2,
            fontSize: Math.min(slot.width, slot.height) * 0.2,
            fill: '#f63a9e',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            opacity: 0.6,
          });

          const slotGroup = new fabric.Group([rect, plusText], {
            left: slot.x,
            top: slot.y,
            angle: slot.rotation || 0,
            selectable: false,
            evented: true,
            hoverCursor: 'pointer',
          });

          (slotGroup as any).data = {
            isGuide: true,
            slotId: slot.id,
            targetSlot: {
              x: slot.x + slot.width / 2,
              y: slot.y + slot.height / 2,
              width: slot.width,
              height: slot.height,
            },
          };

          // Click handler is managed at canvas level for better browser compatibility
          canvas.add(slotGroup);
          canvas.sendObjectToBack(slotGroup);
        }
      });
    }

    canvas.renderAll();
  };

  // Draw template guides when template or photos change
  useEffect(() => {
    if (!fabricCanvasRef.current || isLoading) return;

    drawTemplateGuides();
  }, [template, width, height, isLoading, photos]);

  // Debounced update to prevent excessive re-renders
  const updatePhotosFromCanvas = React.useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();

    const updatedPhotos = objects
      .map((obj: any) => {
        const instanceId = obj.data?.instanceId;
        const existingPhoto = photos.find(p => p.instanceId === instanceId);

        if (!existingPhoto) return null;

        return {
          ...existingPhoto,
          x: obj.left || 0,
          y: obj.top || 0,
          width: (obj.width || 0) * (obj.scaleX || 1),
          height: (obj.height || 0) * (obj.scaleY || 1),
          rotation: obj.angle || 0,
          scale: obj.scaleX || 1,
        };
      })
      .filter(Boolean) as CollagePhoto[];

    onPhotosChange(updatedPhotos);

    // Export canvas for 3D preview
    if (onCanvasUpdate && objects.length > 0) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1,
      });
      onCanvasUpdate(dataURL);
    }
  }, [photos, onPhotosChange, onCanvasUpdate]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.5);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Get effective zoom (viewport scale * manual zoom)
  const getEffectiveZoom = () => {
    return viewportScale * zoom;
  };

  const handleDelete = () => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      const instanceId = (activeObject as any).data?.instanceId;

      // Remove from photos array
      if (instanceId) {
        const updatedPhotos = photos.filter(p => p.instanceId !== instanceId);
        onPhotosChange(updatedPhotos);
      }

      // Remove from canvas
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
      toast.success('Photo removed');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace to remove selected photo
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, photos]); // Dependencies to access current state

  const handleCrop = () => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject || !(activeObject instanceof fabric.FabricImage)) {
      toast.error('Please select an image to crop');
      return;
    }

    // Get the photo data for this object
    const instanceId = (activeObject as any).data?.instanceId;
    const photo = photos.find(p => p.instanceId === instanceId);

    if (!photo) {
      toast.error('Photo data not found');
      return;
    }

    // Get current slot dimensions (where the photo is placed)
    const targetSlot = {
      x: photo.x || 0,
      y: photo.y || 0,
      width: photo.width || 100,
      height: photo.height || 100,
    };

    // Open crop modal with current photo
    setPendingPhoto({
      photo,
      slotId: photo.slotId || null,
      targetSlot,
    });
    setShowCropModal(true);
  };

  // Handle file upload from slot click
  const handleSlotFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !pendingSlotForUpload) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const photoId = `photo-${Date.now()}`;
        const photo: CollagePhoto = {
          id: photoId,
          instanceId: photoId,
          file,
          url: e.target?.result as string,
          rotation: 0,
          isPlaced: false,
          originalWidth: img.width,
          originalHeight: img.height,
        };

        // Open crop modal immediately
        setPendingPhoto({
          photo,
          slotId: pendingSlotForUpload.slotId,
          targetSlot: pendingSlotForUpload.targetSlot,
        });
        setShowCropModal(true);
        setPendingSlotForUpload(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  return (
    <div className='flex flex-col h-full bg-gray-50 relative'>
      {/* Initial Loading */}
      {isLoading && (
        <div className='absolute inset-0 bg-gray-50 z-30 flex items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e] mx-auto mb-2' />
            <p className='text-sm text-gray-600'>Initializing canvas...</p>
          </div>
        </div>
      )}

      {/* Loading Images Overlay */}
      {loadingImages && !isLoading && (
        <div className='absolute inset-0 bg-black/5 backdrop-blur-sm z-20 flex items-center justify-center'>
          <div className='bg-white rounded-xl shadow-lg px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3'>
            <Loader2 className='w-4 md:w-5 h-4 md:h-5 animate-spin text-[#f63a9e]' />
            <span className='text-xs md:text-sm font-medium text-gray-700'>
              Loading images...
            </span>
          </div>
        </div>
      )}

      {/* Mobile instruction banner */}
      {!loadingImages &&
        !isLoading &&
        template &&
        template.type !== 'freeform' && (
          <div className='md:hidden absolute top-4 left-4 right-4 z-10 bg-[#f63a9e] text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2'>
            <Upload className='w-4 h-4 flex-shrink-0' />
            <span>Tap the + icons or empty slots to upload photos</span>
          </div>
        )}

      {/* Floating Toolbar - Image Edit Crop & Delete */}
      {selectedObjectType === 'image' &&
        selectedObjectId &&
        !loadingImages &&
        !isLoading && (
          <div className='absolute left-1/2 transform -translate-x-1/2 top-4 md:top-8 z-10 bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-1 md:gap-2'>
            <Button
              size='sm'
              variant='ghost'
              onClick={handleCrop}
              className='h-8 md:h-10 px-3 md:px-5 text-[#f63a9e] hover:bg-[#f63a9e]/10 font-medium text-xs md:text-sm'
            >
              <Crop className='w-3 md:w-4 h-3 md:h-4 md:mr-2' />
              <span className='hidden md:inline'>Edit Crop</span>
            </Button>

            <div className='w-px h-4 md:h-6 bg-gray-300' />

            <Button
              size='sm'
              variant='ghost'
              onClick={handleDelete}
              className='h-8 md:h-10 px-3 md:px-5 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium text-xs md:text-sm'
            >
              <Trash2 className='w-3 md:w-4 h-3 md:h-4 md:mr-2' />
              <span className='hidden md:inline'>Delete</span>
            </Button>
          </div>
        )}

      {/* Zoom Controls - Bottom Right - Mobile Responsive */}
      {!isLoading && (
        <div className='absolute bottom-4 md:bottom-6 right-4 md:right-6 z-10 bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 px-1.5 md:px-2 py-1.5 md:py-2 flex items-center gap-0.5 md:gap-1'>
          <Button
            size='sm'
            variant='ghost'
            onClick={handleZoomOut}
            className='h-7 w-7 md:h-8 md:w-8 p-0'
          >
            <ZoomOut className='w-3 md:w-4 h-3 md:h-4' />
          </Button>

          <button
            onClick={handleResetZoom}
            className='h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded'
            title={`Viewport: ${Math.round(viewportScale * 100)}% × Manual: ${Math.round(zoom * 100)}%`}
          >
            {Math.round(getEffectiveZoom() * 100)}%
          </button>

          <Button
            size='sm'
            variant='ghost'
            onClick={handleZoomIn}
            className='h-7 w-7 md:h-8 md:w-8 p-0'
          >
            <ZoomIn className='w-3 md:w-4 h-3 md:h-4' />
          </Button>
        </div>
      )}

      {/* Hidden file input for slot uploads (mobile) */}
      <input
        ref={slotUploadInputRef}
        type='file'
        accept='image/*'
        onChange={handleSlotFileUpload}
        className='hidden'
      />

      {/* Canvas Container - Always render - Mobile Responsive */}
      <div
        ref={containerRef}
        className='flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-2 md:p-4 lg:p-8'
        onDragOver={e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={e => {
          e.preventDefault();
          // Clean up drag state if needed
        }}
        onDrop={e => {
          e.preventDefault();
          const photoId = e.dataTransfer.getData('photoId');
          if (!photoId || !fabricCanvasRef.current || !template) return;

          // Only handle drops from sidebar (new photo placement)
          const photo = photos.find(p => p.id === photoId);
          if (!photo) return;

          // Get drop coordinates relative to canvas
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const canvasWidth = inchesToPixels(width);
          const canvasHeight = inchesToPixels(height);
          const effectiveZoom = viewportScale * zoom;

          // Calculate canvas position on screen
          const canvasLeft = rect.left;
          const canvasTop = rect.top;

          // Get drop position relative to canvas
          const dropX = (e.clientX - canvasLeft) / effectiveZoom;
          const dropY = (e.clientY - canvasTop) / effectiveZoom;

          console.log('Drop detected from sidebar:', { photoId, dropX, dropY });

          // Find which slot this corresponds to
          let targetSlot: any = null;
          let slotId: string | null = null;

          if (template.type === 'grid') {
            const config = template.config as GridConfig;
            const { rows, columns, spacing, padding } = config;

            const availableWidth =
              canvasWidth - 2 * padding - (columns - 1) * spacing;
            const availableHeight =
              canvasHeight - 2 * padding - (rows - 1) * spacing;
            const slotWidth = availableWidth / columns;
            const slotHeight = availableHeight / rows;

            // Find which grid cell
            const col = Math.floor((dropX - padding) / (slotWidth + spacing));
            const row = Math.floor((dropY - padding) / (slotHeight + spacing));

            if (col >= 0 && col < columns && row >= 0 && row < rows) {
              slotId = `slot-${row}-${col}`;

              // Check if slot is already occupied
              const isOccupied = photos.some(
                p => p.isPlaced && p.slotId === slotId
              );
              if (isOccupied) {
                toast.error(
                  'This slot is already occupied! Drag an existing photo to replace it.'
                );
                return;
              }

              targetSlot = {
                x: padding + col * (slotWidth + spacing) + slotWidth / 2,
                y: padding + row * (slotHeight + spacing) + slotHeight / 2,
                width: slotWidth - 10,
                height: slotHeight - 10,
              };
            }
          } else if (template.type === 'fixed-slots') {
            const config = template.config as FixedSlotsConfig;
            const { slots } = config;

            // Find closest slot
            for (const slot of slots) {
              const slotCenterX = slot.x + slot.width / 2;
              const slotCenterY = slot.y + slot.height / 2;
              const distance = Math.sqrt(
                Math.pow(dropX - slotCenterX, 2) +
                  Math.pow(dropY - slotCenterY, 2)
              );

              if (distance < Math.max(slot.width, slot.height) / 2) {
                // Check if slot is already occupied
                const isOccupied = photos.some(
                  p => p.isPlaced && p.slotId === slot.id
                );
                if (isOccupied) {
                  toast.error(
                    'This slot is already occupied! Drag an existing photo to replace it.'
                  );
                  return;
                }

                slotId = slot.id;
                targetSlot = {
                  x: slotCenterX,
                  y: slotCenterY,
                  width: slot.width,
                  height: slot.height,
                };
                break;
              }
            }
          } else if (template.type === 'freeform') {
            // For freeform, allow dropping anywhere
            targetSlot = {
              x: dropX,
              y: dropY,
              width: photo.originalWidth,
              height: photo.originalHeight,
            };
          }

          if (!targetSlot) {
            toast.error('Please drop the photo in a template slot');
            return;
          }

          // Open crop modal for user to adjust
          setPendingPhoto({ photo, slotId, targetSlot });
          setShowCropModal(true);
        }}
      >
        {/* Scrollable wrapper with padding for zoomed canvas */}
        <div
          className='relative'
          style={{
            // Add extra space when zoomed to allow smooth scrolling
            padding: zoom > 1 ? `${(zoom - 1) * 200}px` : '0',
          }}
        >
          {/* Debug overlay - Mobile Responsive - Hide on small screens */}
          <div className='hidden md:block absolute -top-8 left-0 bg-black/70 text-white text-xs px-3 py-1 rounded pointer-events-none z-50'>
            Canvas: {inchesToPixels(width)} × {inchesToPixels(height)}px
            {fabricCanvasRef.current && (
              <span className='ml-2'>
                | Objects: {fabricCanvasRef.current.getObjects().length}
              </span>
            )}
            <span className='ml-2'>
              | Scale: {Math.round(viewportScale * 100)}%
            </span>
          </div>

          <div
            className='relative border-2 md:border-4 border-dashed border-gray-300 bg-white shadow-lg md:shadow-2xl'
            style={{
              width: `${inchesToPixels(width)}px`,
              height: `${inchesToPixels(height)}px`,
              transform: `scale(${viewportScale * zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            <canvas
              ref={canvasRef}
              className='absolute top-0 left-0'
              style={{
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {pendingPhoto && (
        <CropModal
          isOpen={showCropModal}
          imageUrl={pendingPhoto.photo.url}
          slotWidth={pendingPhoto.targetSlot.width}
          slotHeight={pendingPhoto.targetSlot.height}
          existingCrop={
            pendingPhoto.photo.cropX !== undefined &&
            pendingPhoto.photo.cropY !== undefined &&
            pendingPhoto.photo.cropWidth !== undefined &&
            pendingPhoto.photo.cropHeight !== undefined &&
            pendingPhoto.photo.scale !== undefined &&
            pendingPhoto.photo.rotation !== undefined
              ? {
                  x: pendingPhoto.photo.cropX,
                  y: pendingPhoto.photo.cropY,
                  width: pendingPhoto.photo.cropWidth,
                  height: pendingPhoto.photo.cropHeight,
                  scale: pendingPhoto.photo.scale,
                  rotation: pendingPhoto.photo.rotation,
                }
              : undefined
          }
          onClose={() => {
            setShowCropModal(false);
            setPendingPhoto(null);
          }}
          onCrop={cropData => {
            if (!pendingPhoto) return;

            const { photo, slotId, targetSlot } = pendingPhoto;

            // Check if this is editing an existing placement or a new placement
            const isEditing = photo.isPlaced;

            if (isEditing) {
              // Update the existing photo instance
              const updatedPhotos = photos.map(p =>
                p.instanceId === photo.instanceId
                  ? {
                      ...p,
                      x: targetSlot.x,
                      y: targetSlot.y,
                      width: targetSlot.width,
                      height: targetSlot.height,
                      scale: cropData.scale,
                      rotation: cropData.rotation,
                      slotId: slotId || undefined,
                      // Update crop data
                      cropX: cropData.x,
                      cropY: cropData.y,
                      cropWidth: cropData.width,
                      cropHeight: cropData.height,
                    }
                  : p
              );
              onPhotosChange(updatedPhotos);
              toast.success('Photo crop updated!');
            } else {
              // Create a new instance of the photo for this placement
              // This allows the same photo to be placed in multiple slots
              const newPhotoInstance: CollagePhoto = {
                ...photo,
                instanceId: generateUniqueId(), // Unique instance ID
                isPlaced: true,
                x: targetSlot.x,
                y: targetSlot.y,
                width: targetSlot.width,
                height: targetSlot.height,
                scale: cropData.scale,
                rotation: cropData.rotation,
                slotId: slotId || undefined,
                // Store crop data to apply when rendering
                cropX: cropData.x,
                cropY: cropData.y,
                cropWidth: cropData.width,
                cropHeight: cropData.height,
              };

              // Add the new instance to the photos array
              onPhotosChange([...photos, newPhotoInstance]);
              toast.success('Photo placed successfully!');
            }

            setShowCropModal(false);
            setPendingPhoto(null);
          }}
        />
      )}
    </div>
  );
}
