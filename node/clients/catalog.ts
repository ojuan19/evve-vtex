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

  export interface Product {
    Id: number;
    Name: string;
    DepartmentId: number;
    CategoryId: number;
    BrandId: number;
    LinkId: string;
    RefId: string;
    IsVisible: boolean;
    Description: string | null;
    DescriptionShort: string | null;
    ReleaseDate: string;
    KeyWords: string | null;
    Title: string;
    IsActive: boolean;
    TaxCode: string;
    MetaTagDescription: string;
    SupplierId: number | null;
    ShowWithoutStock: boolean;
    AdWordsRemarketingCode: string | null;
    LomadeeCampaignCode: string | null;
    Score: number | null;
  }

  export interface ProductSkuIdsMap {
    [productId: string]: number[];
  }

  export interface PaginationRange {
    total: number;
    from: number;
    to: number;
  }

  export interface ProductAndSkuIdsResponse {
    data: ProductSkuIdsMap;
    range: PaginationRange;
  }

  export interface WarehouseInventory {
    warehouseId: string;
    warehouseName: string;
    totalQuantity: number;
    reservedQuantity: number;
    hasUnlimitedQuantity: boolean;
    timeToRefill: string | null;
    dateOfSupplyUtc: string | null;
    leadTime: string;
  }

  export interface SkuInventory {
    skuId: string;
    balance: WarehouseInventory[];
  }
  
  export class CatalogClient extends ExternalClient {
    constructor(ctx: IOContext, options?: InstanceOptions) {
        console.log("BASE" ,`http://${ctx.workspace}--${ctx.account}.myvtex.com` )
        super(`http://${ctx.workspace}--${ctx.account}.myvtex.com`,ctx, {
          ...options,
        })
      }

    public async listInventoryBySku(id:number): Promise<SkuInventory>{
        return this.http.get(`/api/logistics/pvt/inventory/skus/${id}`,{
            metric: "listInventoryBySku",
            headers: {
              "X-VTEX-Use-Https": true,
              "VtexIdclientAutCookie": this.context.adminUserAuthToken
            },
          })
   
    }

    public async getProduct(id:number): Promise<Product>{
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

    public async getProductAndSkuIds(from:number,to:number): Promise<ProductAndSkuIdsResponse>{
        return this.http.get(`/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${from}&_to=${to}`,{
            metric: "getProductAndSkuIds",
            headers: {
              "X-VTEX-Use-Https": true,
              "VtexIdclientAutCookie": this.context.adminUserAuthToken
            },
          })
    }

    public async getSku(id:number): Promise<any>{
        return this.http.get(`/api/catalog/pvt/stockkeepingunit/${id}`,{
            metric: "getproduct",
            headers: {
              "X-VTEX-Use-Https": true,
              "VtexIdclientAutCookie": this.context.adminUserAuthToken
            },
          })
    }
  
    public async getSkuIds(): Promise<number[]> {
      return this.http.get(`/api/catalog_system/pvt/sku/stockkeepingunitids?page=1&pageSize=500000`, {
        metric: "getSkuIds",
        headers: {
          "X-VTEX-Use-Https": true,
          "VtexIdclientAutCookie": this.context.adminUserAuthToken
        },
      })
    }

    public async getAllProductsAndSkuIds(): Promise<ProductSkuIdsMap> {
      const pageSize = 250; // Maximum allowed by the API
      let from = 1;
      let allData: ProductSkuIdsMap = {};
      let hasMoreData = true;

      while (hasMoreData) {
        const to = from + pageSize - 1;
        const response = await this.getProductAndSkuIds(from, to);
        
        // Merge the data from this page with our accumulated data
        allData = { ...allData, ...response.data };
        
        // Check if we've reached the end
        if (response.range.to >= response.range.total) {
          hasMoreData = false;
        } else {
          from = response.range.to + 1;
        }
      }

      return allData;
    }
  }
