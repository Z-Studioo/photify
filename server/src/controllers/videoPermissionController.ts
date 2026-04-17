import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/orders/:orderId/video-permission
 * Update the customer's consent for filming the making of the order.
 * Called from the public confirmation page after checkout.
 */
export async function updateVideoPermission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { orderId } = req.params;
    const { videoPermission } = req.body;

    if (!orderId) {
      res.status(400).json({ error: 'Order id is required' });
      return;
    }

    if (typeof videoPermission !== 'boolean') {
      res.status(400).json({
        error: 'videoPermission must be a boolean',
      });
      return;
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ video_permission: videoPermission })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating video permission:', updateError);
      res.status(500).json({
        error: 'Failed to update video permission',
        details: updateError.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Video permission updated',
      data: {
        order_id: orderId,
        video_permission: videoPermission,
      },
    });
  } catch (error: any) {
    console.error('Error updating video permission:', error);
    res.status(500).json({
      error: 'Failed to update video permission',
      message: error.message,
    });
  }
}
