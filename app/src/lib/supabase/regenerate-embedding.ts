/**
 * Utility function to regenerate embedding for a product
 * Call this after updating product name or categories
 */

export async function regenerateProductEmbedding(productId: string): Promise<void> {
  try {
    // Call the embeddings generation API
    const response = await fetch('/api/embeddings/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      throw new Error('Failed to regenerate embedding');
    }

    const result = await response.json();
    console.log('✅ Embedding regenerated:', result);
  } catch (error) {
    console.error('❌ Failed to regenerate embedding:', error);
    // Don't throw - this is a background operation
    // The product is already marked for regeneration via database trigger
  }
}

/**
 * Queue multiple products for embedding regeneration
 */
export async function queueEmbeddingRegeneration(productIds: string[]): Promise<void> {
  try {
    const response = await fetch('/api/embeddings/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to queue embeddings');
    }

    const result = await response.json();
    console.log('✅ Embeddings queued:', result);
  } catch (error) {
    console.error('❌ Failed to queue embeddings:', error);
  }
}

