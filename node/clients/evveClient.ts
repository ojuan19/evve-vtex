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
  
  const EVVE_BASE_URL = () =>
    `https://primary-production-5936.up.railway.app/`;
  
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
  }