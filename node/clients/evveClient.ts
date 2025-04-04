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
  
  export interface ProductAttribute {
    name: string;
    value: string;
  }

  export interface ProductImage {
    url: string;
    alt: string;
  }

  export interface ProductVariant {
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

  const bearer = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im05WlFVa1JVeUt1a1dfMkFUYW1tNSJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXZ2ZS5jby8iLCJzdWIiOiJhdXRoMHw2N2VkOWQzNzk1YzBmNjVjYTA2MzJmYzAiLCJhdWQiOlsiaHR0cHM6Ly9hcGkuZXZ2ZS5jbyIsImh0dHBzOi8vZGV2LTZpc3k1ZWppb2tsenFyNmsudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc0Mzc4MDcyNCwiZXhwIjoxNzQzODY3MTI0LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwib3JnX2lkIjoib3JnX1lLOU9KYms0WmdRVk12QlkiLCJhenAiOiJPamd5V2wxQXdMTzZ5UnBLUEVnSld3eldxWk9XaWNUZyJ9.Xi39jmgJaO0L6486s1wDwFnhwgeEnYDwyQJw23LDMxLKwnV94CACDNLLGEwelit8n5Id4bbYjKoWqASWfO0E4cyqthfYbYFdD2o2XSSvK6Laa1OFNZY7sSxA7R_ciZaJgGe3WUCOpVAgCTUKCazLDK_FswEJH7VkGTGEXLWBkwbLHllJvAx_cKZWHrh4p9I6eKe80H24qrqtSF1Ajdl07YdzmDo8oxPT7nFyWMGs58M9mhSs7vv69NuUGmvyOwRTAx9w3vtvxunmLlemiQbNTpNGKdlXAewVSQEz6Krqa8OPc2S5MgJoSpQy_z_3E9iFeLkcb7K0BpxEdRDBMpmeiw`
  
  const EVVE_BASE_URL = () =>
    `http://api.evve.co/`;
  
  export default class EvveClient extends ExternalClient {
     constructor(context: IOContext, options?: InstanceOptions) {
      super(EVVE_BASE_URL(), context, {...options,
        headers:{
          "Authorization": `Bearer ${bearer}`,
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
          "X-Vtex-Proxy-To": `api.evve.co`
        },
        body: order,
      });
    }
    public async saveProductAndVariants(product: ProductPayload): Promise<IOResponse<void>>{
      return this.http.post(`api/products`, product, {
        metric: "saveProductAndVariants",
        headers: {
          "X-VTEX-Use-Https": true,
        },
      });
    }
  }