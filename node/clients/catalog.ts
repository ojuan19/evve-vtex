import {
    ExternalClient,
    InstanceOptions,
    IOContext,
  } from "@vtex/api";
  
  
  export class CatalogClient extends ExternalClient {
    constructor(ctx: IOContext, options?: InstanceOptions) {
        console.log("BASE" ,`http://${ctx.workspace}--${ctx.account}.myvtex.com` )
        super(`http://${ctx.workspace}--${ctx.account}.myvtex.com`,ctx, {
          ...options,
        })
      }

    public async getProduct(id:number): Promise<any>{
        return this.http.get(`/api/catalog/pvt/product/${id}`,{
            metric: "getproduct",
            headers: {
              "X-VTEX-Use-Https": true,
              "VtexIdclientAutCookie": this.context.adminUserAuthToken
            },
          })
    }

    public async getSkusByProduct(id:number): Promise<any>{
        return this.http.get(`/api/catalog_system/pvt/sku/stockkeepingunitByProductId/${id}`,{
            metric: "getSkusByProduct",
            headers: {
              "X-VTEX-Use-Https": true,
              "VtexIdclientAutCookie": this.context.adminUserAuthToken
            },
          })
    }

    public async getSku(id:number): Promise<any>{
        return this.http.get(`/api/catalog/pvt/product/${id}`,{
            metric: "getproduct",
            headers: {
              "X-VTEX-Use-Https": true,
              "VtexIdclientAutCookie": this.context.adminUserAuthToken
            },
          })
    }
  
    public async getProductsIds(): Promise<number[]> {
      return this.http.get(`/api/catalog_system/pvt/sku/stockkeepingunitids?page=1&pageSize=500000`, {
        metric: "getProductsIds",
        headers: {
          "X-VTEX-Use-Https": true,
          "VtexIdclientAutCookie": this.context.adminUserAuthToken
        },
      })
    }
  }
