import {
    ExternalClient,
    InstanceOptions,
    IOContext,
  } from "@vtex/api";
  
  export interface Sku {
    IsPersisted: boolean;
    Id: number;
    ProductId: number;
    IsActive: boolean;
    Name: string;
    Height: number;
    RealHeight: number;
    Width: number;
    RealWidth: number;
    Length: number;
    RealLength: number;
    WeightKg: number;
    RealWeightKg: number;
    ModalId: number;
    RefId: string;
    CubicWeight: number;
    IsKit: boolean;
    InternalNote: string | null;
    DateUpdated: string;
    RewardValue: number | null;
    CommercialConditionId: number;
    EstimatedDateArrival: string | null;
    FlagKitItensSellApart: boolean;
    ManufacturerCode: string | null;
    ReferenceStockKeepingUnitId: number | null;
    Position: number;
    ActivateIfPossible: boolean;
    MeasurementUnit: string;
    UnitMultiplier: number;
    IsInventoried: boolean | null;
    IsTransported: boolean | null;
    IsGiftCardRecharge: boolean | null;
    ModalType: string;
    isKitOptimized: boolean;
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

    public async getSkusByProduct(id:number): Promise<Sku[]>{
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
