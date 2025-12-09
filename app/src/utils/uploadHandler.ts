import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { storage, db } from "@/firebase/index";

// Interface for image data stored in IndexedDB
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

// Interface for metadata stored in localStorage
interface Metadata {
  [key: string]: any;
}

// Interface for the final data to be uploaded
export interface FinalUploadData {
  image: string; // This can be either URL (for Firebase) or base64 (for JSON export)
  ratio: string;
  orderedAt: Date;
  inches: string;
  edgeType: string;
  quantity: number;
  totalPrice: number;
  totalPriceAfterDiscount: number;
  metadata: Metadata;
}

// Interface for JSON export data (includes key identifier)
export interface JsonExportData extends FinalUploadData {
  key: string; // Only for JSON exports, not for Firebase
}

// NEW: Function to get image data from IndexedDB as base64
async function getImageBase64FromIndexedDB(): Promise<string | null> {
  try {
    const imageData = await getImageDataFromIndexedDB();
    return imageData?.base64Data || null;
  } catch (error) {
    console.error("Error getting image from IndexedDB:", error);
    return null;
  }
}

// NEW: Function to create final data without any upload process BUT with base64 image
export async function createFinalUploadData(): Promise<JsonExportData | null> {
  try {
    // 1️⃣ Get metadata from localStorage
    const metadataStr = localStorage.getItem("photify_metadata");
    const originalMetadata: Metadata = metadataStr ? JSON.parse(metadataStr) : {};

    if (!originalMetadata) {
      console.warn("No metadata found in localStorage");
      return null;
    }

    console.log("Original metadata for data creation:", originalMetadata);

    // 2️⃣ Extract fields from original metadata
    const selectedRatio = originalMetadata.selectedRatio;
    const selectedSize = originalMetadata.selectedSize;
    const edgeType = originalMetadata.edgeType;
    const quantity = originalMetadata.quantity;

    // Extract slug from selectedSize.Slug (with capital S)
    const slug = selectedSize?.Slug;

    // 3️⃣ Get image data from IndexedDB as base64
    const imageBase64 = await getImageBase64FromIndexedDB();

    // 4️⃣ Create new metadata without selectedSize, quantity, selectedRatio, and edgeType
    const newMetadata: Metadata = {
      // Keep existing metadata except the removed fields
      ...originalMetadata
    };
    
    // Remove fields that should not be in metadata
    delete newMetadata.selectedSize;
    delete newMetadata.quantity;
    delete newMetadata.selectedRatio;
    delete newMetadata.shape; // Remove shape completely
    delete newMetadata.edgeType; // Remove edgeType since it's at top level

    // 5️⃣ Calculate prices
    const { totalPrice, totalPriceAfterDiscount } = calculatePrices(
      selectedSize, 
      getSafeValue(quantity, 1)
    );

    // 6️⃣ Create final data structure WITH base64 image AND key identifier
    const finalData: JsonExportData = {
      // Add the identifier key (only for JSON exports)
      key: "photify-exported-json",
      
      // Top-level fields with safe fallbacks
      image: imageBase64 || "", // Use base64 image if available, otherwise empty string
      ratio: getSafeValue(selectedRatio, "1:1"),
      orderedAt: new Date(),
      inches: getSafeValue(slug, ""),
      edgeType: getSafeValue(edgeType, ""),
      quantity: getSafeValue(quantity, 1),
      totalPrice,
      totalPriceAfterDiscount,
      
      // Metadata (without removed fields)
      metadata: newMetadata
    };

    // Remove any undefined values from the final object
    Object.keys(finalData).forEach(key => {
      if (finalData[key as keyof JsonExportData] === undefined) {
        delete finalData[key as keyof JsonExportData];
      }
    });

    console.log("Created final upload data (without upload):", {
      ...finalData,
      image: imageBase64 ? `base64:${imageBase64.substring(0, 50)}...` : "empty"
    });
    return finalData;

  } catch (error) {
    console.error("Error creating final upload data:", error);
    return null;
  }
}

// NEW: Function to get final data with image upload (original functionality) - WITHOUT key
export async function createFinalUploadDataWithImage(): Promise<FinalUploadData | null> {
  try {
    // 1️⃣ Get image data from IndexedDB
    const imageData = await getImageDataFromIndexedDB();

    if (!imageData || !imageData.base64Data) {
      throw new Error("No image found in IndexedDB. Please upload an image first.");
    }

    console.log("Found image data in IndexedDB:", {
      fileName: imageData.fileName,
      fileType: imageData.fileType,
      fileSize: imageData.fileSize,
      base64Length: imageData.base64Data.length
    });

    // 2️⃣ Convert base64 → Blob
    const blob = base64ToBlob(imageData.base64Data, imageData.fileType);
    const fileName = imageData.fileName || `uploaded_image_${Date.now()}.png`;

    console.log("Converted to blob, size:", blob.size);

    // 3️⃣ Upload to Firebase Storage
    const imageRef = ref(storage, `photify_uploads/${fileName}`);
    console.log("Uploading to Firebase Storage...");
    
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);

    console.log("Upload successful! File available at:", downloadURL);

    // 4️⃣ Create the base data structure (without key for Firebase)
    const baseData = await createBaseDataForFirebase(); // Separate function without key
    
    if (!baseData) {
      throw new Error("Could not create base data structure");
    }

    // 5️⃣ Add the image URL to the data (replace base64 with Firebase URL)
    const finalDataWithImage: FinalUploadData = {
      ...baseData,
      image: downloadURL, // Use Firebase URL instead of base64
      
      // Add file information to metadata
      metadata: {
        ...baseData.metadata,
        fileName: imageData.fileName,
        fileSize: imageData.fileSize,
        fileType: imageData.fileType
      }
    };

    console.log("Final data with image:", finalDataWithImage);
    return finalDataWithImage;

  } catch (err) {
    console.error("Error creating final data with image:", err);
    throw err;
  }
}

// NEW: Function to create base data for Firebase (without key)
async function createBaseDataForFirebase(): Promise<FinalUploadData | null> {
  try {
    // 1️⃣ Get metadata from localStorage
    const metadataStr = localStorage.getItem("photify_metadata");
    const originalMetadata: Metadata = metadataStr ? JSON.parse(metadataStr) : {};

    if (!originalMetadata) {
      console.warn("No metadata found in localStorage");
      return null;
    }

    // 2️⃣ Extract fields from original metadata
    const selectedRatio = originalMetadata.selectedRatio;
    const selectedSize = originalMetadata.selectedSize;
    const edgeType = originalMetadata.edgeType;
    const quantity = originalMetadata.quantity;

    // Extract slug from selectedSize.Slug (with capital S)
    const slug = selectedSize?.Slug;

    // 3️⃣ Create new metadata without selectedSize, quantity, selectedRatio, and edgeType
    const newMetadata: Metadata = {
      // Keep existing metadata except the removed fields
      ...originalMetadata
    };
    
    // Remove fields that should not be in metadata
    delete newMetadata.selectedSize;
    delete newMetadata.quantity;
    delete newMetadata.selectedRatio;
    delete newMetadata.shape;
    delete newMetadata.edgeType;

    // 4️⃣ Calculate prices
    const { totalPrice, totalPriceAfterDiscount } = calculatePrices(
      selectedSize, 
      getSafeValue(quantity, 1)
    );

    // 5️⃣ Create final data structure WITHOUT key (for Firebase)
    const finalData: FinalUploadData = {
      // Top-level fields with safe fallbacks
      image: "", // Will be replaced with Firebase URL
      ratio: getSafeValue(selectedRatio, "1:1"),
      orderedAt: new Date(),
      inches: getSafeValue(slug, ""),
      edgeType: getSafeValue(edgeType, ""),
      quantity: getSafeValue(quantity, 1),
      totalPrice,
      totalPriceAfterDiscount,
      
      // Metadata (without removed fields)
      metadata: newMetadata
    };

    // Remove any undefined values from the final object
    Object.keys(finalData).forEach(key => {
      if (finalData[key as keyof FinalUploadData] === undefined) {
        delete finalData[key as keyof FinalUploadData];
      }
    });

    return finalData;

  } catch (error) {
    console.error("Error creating base data for Firebase:", error);
    return null;
  }
}

// Variable to store the final data (exported for external use)
export let finalUploadData: FinalUploadData | null = null;

// Helper: Convert base64 → Blob (optimized and type-safe)
function base64ToBlob(base64Data: string, contentType: string): Blob {
  const base64WithoutPrefix = base64Data.split(",")[1];
  if (!base64WithoutPrefix) {
    throw new Error("Invalid base64 data");
  }
  
  const byteCharacters = atob(base64WithoutPrefix);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

// Helper: Get image data from IndexedDB
function getImageDataFromIndexedDB(): Promise<ImageData | null> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open("keyval-store");
    
    dbRequest.onerror = () => reject(new Error("IndexedDB open error"));
    dbRequest.onupgradeneeded = () => {
      const db = dbRequest.result;
      if (!db.objectStoreNames.contains("keyval")) {
        db.createObjectStore("keyval");
      }
    };
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains("keyval")) {
        reject(new Error("Keyval store not found in IndexedDB"));
        return;
      }
      
      const tx = db.transaction(["keyval"], "readonly");
      const store = tx.objectStore("keyval");
      
      // Get ALL data from the store (since it's stored as an array)
      const getAllReq = store.getAll();
      
      getAllReq.onsuccess = () => {
        console.log("All data from keyval store:", getAllReq.result);
        
        // The data is stored as an array with one object
        if (getAllReq.result && getAllReq.result.length > 0) {
          const imageData = getAllReq.result[0] as ImageData;
          console.log("Found image data:", imageData);
          resolve(imageData);
        } else {
          resolve(null);
        }
      };
      
      getAllReq.onerror = () => {
        console.error("GetAll request failed:", getAllReq.error);
        reject(new Error("Failed to read image data from IndexedDB"));
      };
    };
  });
}

// Helper: Calculate prices based on metadata
function calculatePrices(selectedSize: any, quantity: number): { totalPrice: number; totalPriceAfterDiscount: number } {
  // Extract unit prices from selectedSize or use defaults
  const unitPriceBeforeDiscount = selectedSize?.actual_price || 0;
  const unitPriceAfterDiscount = selectedSize?.sell_price || unitPriceBeforeDiscount;
  
  return {
    totalPrice: unitPriceBeforeDiscount * quantity,
    totalPriceAfterDiscount: unitPriceAfterDiscount * quantity
  };
}

// Helper: Safely get value and provide fallback
function getSafeValue(value: any, fallback: any = null) {
  return value !== undefined && value !== null ? value : fallback;
}

// New function: Prepare final data without uploading
export async function prepareFinalData(): Promise<FinalUploadData> {
  const data = await createFinalUploadDataWithImage();
  if (!data) {
    throw new Error("Failed to prepare final data");
  }
  finalUploadData = data;
  return data;
}

// New function: Upload prepared data to Firestore
export async function uploadToFirestore(data?: FinalUploadData): Promise<void> {
  try {
    const uploadData = data || finalUploadData;
    
    if (!uploadData) {
      throw new Error("No data to upload. Please prepare data first or provide data parameter.");
    }

    console.log("Uploading to Firestore with data:", uploadData);
    await addDoc(collection(db, "photify_uploads"), uploadData);
    console.log("Successfully uploaded to Firestore!");

  } catch (err) {
    throw err;
  }
}

// Modified original function (maintains backward compatibility)
export async function handleConfirmChanges(): Promise<void> {
  try {
    // Prepare the data first
    await prepareFinalData();
    
    // Then upload to Firestore
    await uploadToFirestore();
    
  } catch (err) {
    throw err;
  }
}

// NEW: Validation functions for JSON imports
export function isValidPhotifyExport(data: any): data is JsonExportData {
  return (
    data &&
    typeof data === 'object' &&
    data.key === "photify-exported-json" &&
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

// In uploadHandler.ts - update the validatePhotifyFile function
export function validatePhotifyFile(fileContent: string): { 
  isValid: boolean; 
  data?: JsonExportData; 
  error?: string;
  summary?: ImportSummary;
} {
  try {
    const parsedData = JSON.parse(fileContent);
    
    // Validate key identifier
    if (!parsedData.key || parsedData.key !== "photify-exported-json") {
      return { 
        isValid: false, 
        error: "This is not a valid Photify export file." 
      };
    }

    // Validate required fields
    const requiredFields = ['ratio', 'inches', 'edgeType', 'quantity', 'totalPrice', 'totalPriceAfterDiscount', 'metadata'];
    const missingFields = requiredFields.filter(field => !(field in parsedData));
    
    if (missingFields.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }

    // Create summary for confirmation modal
    const summary: ImportSummary = {
      hasImage: !!parsedData.image && parsedData.image.startsWith('data:image/'),
      frameSize: parsedData.inches,
      frameRatio: parsedData.ratio,
      edgeType: parsedData.edgeType,
      quantity: parsedData.quantity,
      totalPrice: parsedData.totalPriceAfterDiscount
    };

    return { 
      isValid: true, 
      data: parsedData as JsonExportData,
      summary 
    };

  } catch (error) {
    return { 
      isValid: false, 
      error: "Invalid JSON file format" 
    };
  }
}


// Export types for use in other files
export type { ImageData, Metadata };