import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Photify API',
      version: '1.0.0',
      description: 'Professional Express API for Photify - E-commerce platform',
      contact: {
        name: 'Photify Support',
        email: 'support@photify.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server',
      },
      {
        url: config.CLIENT_URL || 'https://api.photify.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            details: {
              type: 'string',
              example: 'Additional error details',
            },
          },
        },
        CartItem: {
          type: 'object',
          required: ['name', 'price', 'quantity'],
          properties: {
            name: {
              type: 'string',
              example: 'Canvas Print',
            },
            size: {
              type: 'string',
              example: '24x36 inches',
            },
            image: {
              type: 'string',
              example: 'https://example.com/image.jpg',
            },
            price: {
              type: 'number',
              example: 89.99,
            },
            quantity: {
              type: 'integer',
              example: 1,
            },
          },
        },
        CustomerInfo: {
          type: 'object',
          required: ['name', 'email', 'phone'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
          },
        },
        ShippingAddress: {
          type: 'object',
          required: ['address', 'postcode'],
          properties: {
            address: {
              type: 'string',
              example: '123 Main St, City, State',
            },
            postcode: {
              type: 'string',
              example: '12345',
            },
          },
        },
        CheckoutRequest: {
          type: 'object',
          required: ['cartItems', 'customerInfo', 'shippingAddress', 'subtotal', 'deliveryFee', 'total'],
          properties: {
            cartItems: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            customerInfo: {
              $ref: '#/components/schemas/CustomerInfo',
            },
            shippingAddress: {
              $ref: '#/components/schemas/ShippingAddress',
            },
            videoPermission: {
              type: 'boolean',
              example: false,
            },
            subtotal: {
              type: 'number',
              example: 89.99,
            },
            deliveryFee: {
              type: 'number',
              example: 10.0,
            },
            total: {
              type: 'number',
              example: 99.99,
            },
          },
        },
        CheckoutResponse: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              example: 'cs_test_...',
            },
            orderId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-001234',
            },
            url: {
              type: 'string',
              example: 'https://checkout.stripe.com/...',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Checkout',
        description: 'Checkout and order creation endpoints',
      },
      {
        name: 'Webhook',
        description: 'Stripe webhook endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to API routes
};

export const swaggerSpec = swaggerJsdoc(options);
