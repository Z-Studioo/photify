// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { collection, addDoc } from "firebase/firestore";
// import { storage, db } from "@/firebase/index";

// // Interface for image data stored in IndexedDB
// interface ImageData {
//   base64Data: string;
//   fileType: string;
//   fileName?: string;
//   fileSize?: number;
//   preview?: string;
// }

// // Interface for metadata stored in localStorage
// interface Metadata {
//   [key: string]: any;
// }

// // Helper: Convert base64 → Blob (optimized and type-safe)
// function base64ToBlob(base64Data: string, contentType: string): Blob {
//   const base64WithoutPrefix = base64Data.split(",")[1];
//   if (!base64WithoutPrefix) {
//     throw new Error("Invalid base64 data");
//   }
  
//   const byteCharacters = atob(base64WithoutPrefix);
//   const byteNumbers = new Array(byteCharacters.length);
  
//   for (let i = 0; i < byteCharacters.length; i++) {
//     byteNumbers[i] = byteCharacters.charCodeAt(i);
//   }
  
//   const byteArray = new Uint8Array(byteNumbers);
//   return new Blob([byteArray], { type: contentType });
// }

// // Helper: Get image data from IndexedDB - CORRECTED
// function getImageDataFromIndexedDB(): Promise<ImageData | null> {
//   return new Promise((resolve, reject) => {
//     const dbRequest = indexedDB.open("keyval-store");
    
//     dbRequest.onerror = () => reject(new Error("IndexedDB open error"));
//     dbRequest.onupgradeneeded = () => {
//       const db = dbRequest.result;
//       if (!db.objectStoreNames.contains("keyval")) {
//         db.createObjectStore("keyval");
//       }
//     };
//     dbRequest.onsuccess = (event) => {
//       const db = (event.target as IDBOpenDBRequest).result;
      
//       if (!db.objectStoreNames.contains("keyval")) {
//         reject(new Error("Keyval store not found in IndexedDB"));
//         return;
//       }
      
//       const tx = db.transaction(["keyval"], "readonly");
//       const store = tx.objectStore("keyval");
      
//       // Get ALL data from the store (since it's stored as an array)
//       const getAllReq = store.getAll();
      
//       getAllReq.onsuccess = () => {
//         console.log("All data from keyval store:", getAllReq.result);
        
//         // The data is stored as an array with one object
//         if (getAllReq.result && getAllReq.result.length > 0) {
//           const imageData = getAllReq.result[0] as ImageData;
//           console.log("Found image data:", imageData);
//           resolve(imageData);
//         } else {
//           resolve(null);
//         }
//       };
      
//       getAllReq.onerror = () => {
//         console.error("GetAll request failed:", getAllReq.error);
//         reject(new Error("Failed to read image data from IndexedDB"));
//       };
//     };
//   });
// }

// export async function handleConfirmChanges(): Promise<void> {
//   try {
//     // 1️⃣ Get image data from IndexedDB
//     const imageData = await getImageDataFromIndexedDB();

//     if (!imageData || !imageData.base64Data) {
//       throw new Error("No image found in IndexedDB. Please upload an image first.");
//     }

//     console.log("Found image data in IndexedDB:", {
//       fileName: imageData.fileName,
//       fileType: imageData.fileType,
//       fileSize: imageData.fileSize,
//       base64Length: imageData.base64Data.length
//     });

//     // 2️⃣ Convert base64 → Blob
//     const blob = base64ToBlob(imageData.base64Data, imageData.fileType);
//     const fileName = imageData.fileName || `uploaded_image_${Date.now()}.png`;

//     console.log("Converted to blob, size:", blob.size);

//     // 3️⃣ Upload to Firebase Storage
//     const imageRef = ref(storage, `photify_uploads/${fileName}`);
//     console.log("Uploading to Firebase Storage...");
    
//     await uploadBytes(imageRef, blob);
//     const downloadURL = await getDownloadURL(imageRef);

//     console.log("Upload successful! File available at:", downloadURL);

//     // 4️⃣ Get metadata from localStorage
//     const metadataStr = localStorage.getItem("photify_metadata");
//     const metadata: Metadata = metadataStr ? JSON.parse(metadataStr) : {};

//     // 5️⃣ Save metadata + image URL to Firestore
//     console.log("Saving to Firestore...");
//     await addDoc(collection(db, "photify_uploads"), {
//       imageURL: downloadURL,
//       metadata,
//       uploadedAt: new Date(),
//       fileName: imageData.fileName,
//       fileSize: imageData.fileSize,
//       fileType: imageData.fileType
//     });

//     console.log("Firestore save successful!");
//     console.log("Image URL:", downloadURL);

//   } catch (err) {
//     console.error("Upload failed:", err);
//     throw err;
//   }
// }

// // Export types for use in other files
// export type { ImageData, Metadata };

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

// Interface for metadata stored in localStorage
interface Metadata {
  [key: string]: any;
}

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

export async function handleConfirmChanges(): Promise<void> {
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

    // 4️⃣ Get metadata from localStorage
    const metadataStr = localStorage.getItem("photify_metadata");
    const originalMetadata: Metadata = metadataStr ? JSON.parse(metadataStr) : {};

    console.log("Original metadata:", originalMetadata);

    // 5️⃣ Extract fields from original metadata
    const selectedRatio = originalMetadata.selectedRatio;
    const selectedSize = originalMetadata.selectedSize;
    const edgeType = originalMetadata.edgeType;
    const quantity = originalMetadata.quantity;

    // Extract slug from selectedSize.Slug (with capital S)
    const slug = selectedSize?.Slug;

    // 6️⃣ Create new metadata without selectedSize, quantity, selectedRatio, and edgeType
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

    // Add file information to metadata
    newMetadata.fileName = imageData.fileName;
    newMetadata.fileSize = imageData.fileSize;
    newMetadata.fileType = imageData.fileType;

    // 7️⃣ Calculate prices
    const { totalPrice, totalPriceAfterDiscount } = calculatePrices(
      selectedSize, 
      getSafeValue(quantity, 1)
    );

    // 8️⃣ Prepare Firestore document with safe values (no undefined)
    const firestoreData: any = {
      // Top-level fields with safe fallbacks
      image: downloadURL,
      ratio: getSafeValue(selectedRatio, "1:1"),
      orderedAt: new Date(),
      inches: getSafeValue(slug, ""), // Now this will get the slug from selectedSize.Slug
      edgeType: getSafeValue(edgeType, ""),
      quantity: getSafeValue(quantity, 1),
      totalPrice,
      totalPriceAfterDiscount,
      
      // Metadata (with fileName, fileSize, fileType inside, and without removed fields)
      metadata: newMetadata
    };

    // Remove any undefined values from the final object to prevent Firestore errors
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key] === undefined) {
        delete firestoreData[key];
      }
    });

    console.log("Final Firestore data:", firestoreData);

    // 9️⃣ Save to Firestore with new structure
    console.log("Saving to Firestore with new structure...");
    await addDoc(collection(db, "photify_uploads"), firestoreData);

    console.log("Firestore save successful with new structure!");
    console.log("Image URL:", downloadURL);

  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
}

// Export types for use in other files
export type { ImageData, Metadata };