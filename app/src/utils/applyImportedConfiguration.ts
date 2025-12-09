import { set } from 'idb-keyval';
import { fetchRatios, fetchInches, type InchData, type RatioData } from '@/utils/ratio-sizes';
import type { JsonExportData } from '@/utils/uploadHandler';
import type { SizeData } from '@/context/UploadContext';


export interface ApplyImportResult {
  success: boolean;
  file: File | null;
  preview: string | null;
  ratio: string | null;
  size: SizeData | null;
  quality: number[];
  edgeType: 'wrapped' | 'mirrored';
  quantity: number;
  error?: string;
}


function base64ToFile(base64Data: string, fileName: string = 'imported-image.png'): File {
  // Extract the base64 content and mime type
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 data format');
  }

  const mimeType = matches[1];
  const base64Content = matches[2];

  // Convert base64 to binary
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Create File from Blob
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Helper function to find matching ratio from available ratios
 */
function findMatchingRatio(
  importedRatio: string,
  availableRatios: RatioData[]
): RatioData | null {
  // Try exact match first
  const exactMatch = availableRatios.find(r => r.ratio === importedRatio);
  if (exactMatch) return exactMatch;

  // If no exact match, return the first ratio (default)
  return availableRatios.length > 0 ? availableRatios[0] : null;
}

/**
 * Helper function to find matching size from available sizes
 */
function findMatchingSize(
  importedInches: string,
  availableSizes: InchData[],
  selectedRatio: RatioData
): SizeData | null {
  // Filter sizes that belong to the selected ratio
  const ratioSizes = availableSizes.filter(size =>
    selectedRatio.Inches.includes(size._id)
  );

  // Try to find exact match by Slug
  const exactMatch = ratioSizes.find(size => size.Slug === importedInches);
  if (exactMatch) {
    return exactMatch as SizeData;
  }

  // If no exact match, return the smallest size for this ratio
  if (ratioSizes.length > 0) {
    const sorted = ratioSizes.sort((a, b) =>
      (a.width * a.height) - (b.width * b.height)
    );
    return sorted[0] as SizeData;
  }

  return null;
}

export async function applyImportedConfiguration(
  importData: JsonExportData
): Promise<ApplyImportResult> {
  try {
    console.log('🔄 Starting import configuration process...', importData);

    // Step 1: Handle image if present
    let file: File | null = null;
    let preview: string | null = null;

    if (importData.image && importData.image.startsWith('data:image/')) {
      console.log('📷 Converting base64 image to File...');

      // Generate filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `imported-image-${timestamp}.png`;

      // Convert base64 to File
      file = base64ToFile(importData.image, fileName);
      preview = importData.image; // Use base64 as preview

      console.log('✅ Image converted:', {
        fileName: file.name,
        size: file.size,
        type: file.type
      });

      // Step 2: Store in IndexedDB
      console.log('💾 Storing image in IndexedDB...');

      const imageData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        base64Data: importData.image,
        preview: importData.image,
        originalPreview: importData.image,
        version: 1
      };

      await set('photify_uploaded_image', imageData);
      console.log('✅ Image stored in IndexedDB');
    } else {
      console.log('ℹ️ No image in import data');
    }

    // Step 3: Fetch available ratios and sizes from API
    console.log('🌐 Fetching ratios and sizes from API...');

    const [ratiosData, inchesData] = await Promise.all([
      fetchRatios(),
      fetchInches()
    ]);

    console.log('✅ Fetched data:', {
      ratiosCount: ratiosData.length,
      inchesCount: inchesData.length
    });

    // Step 4: Find matching ratio
    const matchedRatio = findMatchingRatio(importData.ratio, ratiosData);

    if (!matchedRatio) {
      throw new Error('Could not find matching ratio in available options');
    }

    console.log('✅ Matched ratio:', matchedRatio.ratio);

    // Step 5: Find matching size
    const matchedSize = findMatchingSize(
      importData.inches,
      inchesData,
      matchedRatio
    );

    if (!matchedSize) {
      throw new Error('Could not find matching size in available options');
    }

    console.log('✅ Matched size:', {
      slug: matchedSize.Slug,
      dimensions: `${matchedSize.width}" × ${matchedSize.height}"`
    });

    // Step 6: Extract quality from metadata
    const quality = importData.metadata?.quality || [70];
    console.log('✅ Quality setting:', quality);

    // Step 7: Extract edge type
    const edgeType = (importData.edgeType === 'wrapped' || importData.edgeType === 'mirrored')
      ? importData.edgeType
      : 'wrapped';
    console.log('✅ Edge type:', edgeType);

    // Step 8: Extract quantity
    const quantity = importData.quantity || 1;
    console.log('✅ Quantity:', quantity);

    // Return all mapped data
    const result: ApplyImportResult = {
      success: true,
      file,
      preview,
      ratio: matchedRatio.ratio,
      size: matchedSize,
      quality,
      edgeType,
      quantity
    };

    console.log('🎉 Import configuration applied successfully!');
    return result;

  } catch (error) {
    console.error('❌ Error applying imported configuration:', error);

    return {
      success: false,
      file: null,
      preview: null,
      ratio: null,
      size: null,
      quality: [70],
      edgeType: 'wrapped',
      quantity: 1,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
