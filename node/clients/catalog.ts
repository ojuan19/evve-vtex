import {
    ExternalClient,
    InstanceOptions,
    IOContext,
  } from "@vtex/api";
  
  export interface ProductsAndSkusResponse {
    data: Record<string, number[]>;
    range: {
      total: number;
      from: number;
      to: number;
    };
  }
  
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
  
    public async getProductsAndSkus(from: number, to: number): Promise<ProductsAndSkusResponse> {
      return this.http.get(`/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${from}&_to=${to}`, {
        metric: "getProductsAndSkus",
        headers: {
          "X-VTEX-Use-Https": true,
          "VtexIdclientAutCookie": this.context.adminUserAuthToken
        },
      })
    }
    
    public async getAllProductsAndSkus(): Promise<Record<string, number[]>> {
      const pageSize = 250
      let from = 1
      let to = pageSize
      let allProducts: Record<string, number[]> = {}
      
      // First request to get total and first batch
      const firstResponse = await this.getProductsAndSkus(from, to)
      const total = firstResponse.range.total
      allProducts = { ...firstResponse.data }
      
      // Continue fetching if there are more products
      while (to < total) {
        from = to + 1
        to = Math.min(from + pageSize - 1, total)
        
        const response = await this.getProductsAndSkus(from, to)
        allProducts = { ...allProducts, ...response.data }
      }
      
      return allProducts
    }
  }
