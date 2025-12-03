import axios from 'axios';

interface ShopifyConfig {
  shopName: string;
  accessToken: string;
}

export class ShopifyService {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: ShopifyConfig) {
    this.baseUrl = `https://${config.shopName}/admin/api/2024-01`;
    this.accessToken = config.accessToken;
  }

  private async request(method: 'GET' | 'POST', endpoint: string, data?: any) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios({
        method,
        url,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
        },
        data,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Shopify API Error (${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  async getCustomers() {
    return this.request('GET', '/customers.json');
  }

  async getProducts() {
    return this.request('GET', '/products.json');
  }

  async getOrders() {
    return this.request('GET', '/orders.json?status=any');
  }

  // Create methods for seeding data in Shopify
  async createCustomer(customer: {
    email: string;
    first_name?: string;
    last_name?: string;
  }) {
    return this.request('POST', '/customers.json', { customer });
  }

  async createProduct(product: {
    title: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    variants?: Array<{
      price: string;
      inventory_quantity?: number;
    }>;
  }) {
    return this.request('POST', '/products.json', { product });
  }

  async createOrder(order: {
    line_items: Array<{
      variant_id: number;
      quantity: number;
    }>;
    customer?: {
      id: number;
    };
    financial_status?: string;
    total_price?: string;
    currency?: string;
  }) {
    return this.request('POST', '/orders.json', { order });
  }

  async getProductVariants(productId: number) {
    return this.request('GET', `/products/${productId}.json`);
  }

  async getCustomerByEmail(email: string) {
    return this.request('GET', `/customers/search.json?query=email:${email}`);
  }
}
