import {
    ExternalClient,
    InstanceOptions,
    IOContext,
    IOResponse,
  } from "@vtex/api";

  interface EvvePayload {
    platform: string
  }
  
  interface OrderPayload extends EvvePayload{
    order: any
  }
  
  interface ProductAttribute {
    name: string;
    value: string;
  }
  
  interface ProductImage {
    url: string;
    alt: string;
  }
  
  interface ProductVariant {
    code: number;
    name: string;
    price: number;
    stock: number;
    attributes?: ProductAttribute[];
    images?: ProductImage[];
  }
  
  export interface ProductPayload {
    code: number;
    name: string;
    brand_name: string;
    short_description: string;
    detailed_description: string;
    variants: ProductVariant[];
  }
  
  const EVVE_BASE_URL = () =>
    `https://api.evve.co/`;
  
  export default class EvveClient extends ExternalClient {
     constructor(context: IOContext, options?: InstanceOptions) {
      super(EVVE_BASE_URL(), context, {...options,
        headers:{
          "Authorization": `Basic ZXZ2ZXJvb3Q6aFd3Q2JLeFNrTG5IbHZuSTZ5ZHI=`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        }
      });
    }
  
    public async saveOrder(order: OrderPayload): Promise<IOResponse<void>> {
      return this.http.post(`webhook-test/order`, {
        metric: "evve-save-order",
        headers: {
          "X-VTEX-Use-Https": true,
        },
        body: order,
      });
    }
    public async saveProductAndVariants(product: ProductPayload): Promise<IOResponse<void>>{
      return this.http.post(`api/products`, {
        metric: "saveProductAndVariants",
        headers: {
          "X-VTEX-Use-Https": true,
        },
        body: product,
      });
    }
  }
