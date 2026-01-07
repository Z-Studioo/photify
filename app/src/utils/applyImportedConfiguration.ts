import { set } from 'idb-keyval';
import {
  fetchRatios,
  fetchInches,
  type InchData,
  type RatioData,
} from '@/utils/ratio-sizes';
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

function base64ToFile(
  base64Data: string,
  fileName: string = 'imported-image.png'
): File {
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 data format');
  }

  const mimeType = matches[1];
  const base64Content = matches[2];

  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

function findMatchingRatio(
  importedRatio: string,
  availableRatios: RatioData[]
): RatioData | null {
  const exactMatch = availableRatios.find(r => r.ratio === importedRatio);
  if (exactMatch) return exactMatch;
  return availableRatios.length > 0 ? availableRatios[0] : null;
}

function findMatchingSize(
  importedInches: string,
  availableSizes: InchData[],
  selectedRatio: RatioData
): SizeData | null {
  const ratioSizes = availableSizes.filter(size =>
    selectedRatio.Inches.includes(size._id)
  );
  const exactMatch = ratioSizes.find(size => size.Slug === importedInches);
  if (exactMatch) {
    return exactMatch as SizeData;
  }
  if (ratioSizes.length > 0) {
    const sorted = ratioSizes.sort(
      (a, b) => a.width * a.height - b.width * b.height
    );
    return sorted[0] as SizeData;
  }

  return null;
}

export async function applyImportedConfiguration(
  importData: JsonExportData
): Promise<ApplyImportResult> {
  try {
    let file: File | null = null;
    let preview: string | null = null;

    if (importData.image && importData.image.startsWith('data:image/')) {
      const timestamp = new Date().getTime();
      const fileName = `imported-image-${timestamp}.png`;
      file = base64ToFile(importData.image, fileName);
      preview = importData.image;

      const imageData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        base64Data: importData.image,
        preview: importData.image,
        originalPreview: importData.image,
        version: 1,
      };

      await set('photify_uploaded_image', imageData);
    }

    const [ratiosData, inchesData] = await Promise.all([
      fetchRatios(),
      fetchInches(),
    ]);
    const matchedRatio = findMatchingRatio(importData.ratio, ratiosData);

    if (!matchedRatio) {
      throw new Error('Could not find matching ratio in available options');
    }
    const matchedSize = findMatchingSize(
      importData.inches,
      inchesData,
      matchedRatio
    );

    if (!matchedSize) {
      throw new Error('Could not find matching size in available options');
    }
    const quality = importData.metadata?.quality || [70];
    const edgeType =
      importData.edgeType === 'wrapped' || importData.edgeType === 'mirrored'
        ? importData.edgeType
        : 'wrapped';

    const quantity = importData.quantity || 1;

    const result: ApplyImportResult = {
      success: true,
      file,
      preview,
      ratio: matchedRatio.ratio,
      size: matchedSize,
      quality,
      edgeType,
      quantity,
    };
    return result;
  } catch (error) {
    console.error('Error applying imported configuration:', error);

    return {
      success: false,
      file: null,
      preview: null,
      ratio: null,
      size: null,
      quality: [70],
      edgeType: 'wrapped',
      quantity: 1,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
