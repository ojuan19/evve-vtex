import {
    ExternalClient,
    InstanceOptions,
    IOContext,
  } from "@vtex/api";
  
  const ORDERS_BASE_URL = (accountName: string, workspace: string) =>
    `http://${workspace}--${accountName}.myvtex.com/api/oms/pvt`;
  
  export default class OrdersClient extends ExternalClient {
     constructor(context: IOContext, options?: InstanceOptions) {
      super(ORDERS_BASE_URL(context.account, context.workspace), context, options);
    }
  
    public async getOrder(orderId: string): Promise<string> {
      return this.http.get(`/orders/${orderId}`, {
        metric: "evve-order-get",
        headers: {
          "X-VTEX-Use-Https": true,
          "VtexIdclientAutCookie": this.context.authToken
        },
      });
    }
  }