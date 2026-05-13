interface ImageData {
  base64Data: string;
  fileType: string;
  fileName?: string;
  fileSize?: number;
  preview?: string;
}

interface ImportSummary {
  hasImage: boolean;
  frameSize: string;
  frameRatio: string;
  edgeType: string;
  quantity: number;
  totalPrice: number;
}

interface Metadata {
  [key: string]: any;
}

export interface FinalUploadData {
  image: string;
  ratio: string;
  orderedAt: Date;
  inches: string;
  edgeType: string;
  quantity: number;
  totalPrice: number;
  totalPriceAfterDiscount: number;
  metadata: Metadata;
}

export interface JsonExportData extends FinalUploadData {
  key: string;
}

async function getImageBase64FromIndexedDB(): Promise<string | null> {
  try {
    const imageData = await getImageDataFromIndexedDB();
    return imageData?.base64Data || null;
  } catch (error) {
    console.error('Error getting image from IndexedDB:', error);
    return null;
  }
}

export async function createFinalUploadData(): Promise<JsonExportData | null> {
  try {
    const metadataStr = localStorage.getItem('photify_metadata');
    const originalMetadata: Metadata = metadataStr
      ? JSON.parse(metadataStr)
      : {};

    if (!originalMetadata) {
      console.warn('No metadata found in localStorage');
      return null;
    }

    const selectedRatio = originalMetadata.selectedRatio;
    const selectedSize = originalMetadata.selectedSize;
    const edgeType = originalMetadata.edgeType;
    const quantity = originalMetadata.quantity;

    const slug = selectedSize?.Slug;
    const imageBase64 = await getImageBase64FromIndexedDB();
    const newMetadata: Metadata = {
      ...originalMetadata,
    };
    delete newMetadata.selectedSize;
    delete newMetadata.quantity;
    delete newMetadata.selectedRatio;
    delete newMetadata.shape;
    delete newMetadata.edgeType;

    const { totalPrice, totalPriceAfterDiscount } = calculatePrices(
      selectedSize,
      getSafeValue(quantity, 1)
    );
    const finalData: JsonExportData = {
      key: 'photify-exported-json',

      image: imageBase64 || '',
      ratio: getSafeValue(selectedRatio, '1:1'),
      orderedAt: new Date(),
      inches: getSafeValue(slug, ''),
      edgeType: getSafeValue(edgeType, ''),
      quantity: getSafeValue(quantity, 1),
      totalPrice,
      totalPriceAfterDiscount,

      metadata: newMetadata,
    };

    Object.keys(finalData).forEach(key => {
      if (finalData[key as keyof JsonExportData] === undefined) {
        delete finalData[key as keyof JsonExportData];
      }
    });
    return finalData;
  } catch (error) {
    console.error('Error creating final upload data:', error);
    return null;
  }
}

function getImageDataFromIndexedDB(): Promise<ImageData | null> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('keyval-store');

    dbRequest.onerror = () => reject(new Error('IndexedDB open error'));
    dbRequest.onupgradeneeded = () => {
      const db = dbRequest.result;
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval');
      }
    };
    dbRequest.onsuccess = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('keyval')) {
        reject(new Error('Keyval store not found in IndexedDB'));
        return;
      }

      const tx = db.transaction(['keyval'], 'readonly');
      const store = tx.objectStore('keyval');

      const getAllReq = store.getAll();

      getAllReq.onsuccess = () => {
        if (getAllReq.result && getAllReq.result.length > 0) {
          const imageData = getAllReq.result[0] as ImageData;
          resolve(imageData);
        } else {
          resolve(null);
        }
      };

      getAllReq.onerror = () => {
        console.error('GetAll request failed:', getAllReq.error);
        reject(new Error('Failed to read image data from IndexedDB'));
      };
    };
  });
}

function calculatePrices(
  selectedSize: any,
  quantity: number
): { totalPrice: number; totalPriceAfterDiscount: number } {
  const unitPriceBeforeDiscount = selectedSize?.actual_price || 0;
  const unitPriceAfterDiscount =
    selectedSize?.sell_price || unitPriceBeforeDiscount;

  return {
    totalPrice: unitPriceBeforeDiscount * quantity,
    totalPriceAfterDiscount: unitPriceAfterDiscount * quantity,
  };
}

function getSafeValue(value: any, fallback: any = null) {
  return value !== undefined && value !== null ? value : fallback;
}

export function isValidPhotifyExport(data: any): data is JsonExportData {
  return (
    data &&
    typeof data === 'object' &&
    data.key === 'photify-exported-json' &&
    typeof data.image === 'string' &&
    typeof data.ratio === 'string' &&
    data.orderedAt instanceof Date &&
    typeof data.inches === 'string' &&
    typeof data.edgeType === 'string' &&
    typeof data.quantity === 'number' &&
    typeof data.totalPrice === 'number' &&
    typeof data.totalPriceAfterDiscount === 'number' &&
    typeof data.metadata === 'object'
  );
}

export function validatePhotifyFile(fileContent: string): {
  isValid: boolean;
  data?: JsonExportData;
  error?: string;
  summary?: ImportSummary;
} {
  try {
    const parsedData = JSON.parse(fileContent);
    if (!parsedData.key || parsedData.key !== 'photify-exported-json') {
      return {
        isValid: false,
        error: 'This is not a valid Photify export file.',
      };
    }
    const requiredFields = [
      'ratio',
      'inches',
      'edgeType',
      'quantity',
      'totalPrice',
      'totalPriceAfterDiscount',
      'metadata',
    ];
    const missingFields = requiredFields.filter(
      field => !(field in parsedData)
    );

    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }
    const summary: ImportSummary = {
      hasImage:
        !!parsedData.image && parsedData.image.startsWith('data:image/'),
      frameSize: parsedData.inches,
      frameRatio: parsedData.ratio,
      edgeType: parsedData.edgeType,
      quantity: parsedData.quantity,
      totalPrice: parsedData.totalPriceAfterDiscount,
    };

    return {
      isValid: true,
      data: parsedData as JsonExportData,
      summary,
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid JSON file format',
    };
  }
}

export type { ImageData, Metadata };
