import { Product, Sku } from "../clients/catalog";

interface SkuWithInventory {
  sku: Sku;
  totalInventory: number;
}

interface ProductSkus {
  productId: number;
  productData: Product | null;
  skus: SkuWithInventory[];
}

export const catalogSync = async (
    _: any,
    _payload: any,
    ctx: Context
  ) => {
    const { clients } = ctx
    const allProductSkus: ProductSkus[] = [];
    
    try {
        console.log("Starting catalog sync process");
        
        // Get all product IDs and their associated SKU IDs
        console.log("Fetching all product and SKU IDs...");
        const productSkuMap = await clients.catalogEvve.getAllProductsAndSkuIds();
        const productIds = Object.keys(productSkuMap).map(id => parseInt(id, 10));
        
        console.log(`Retrieved ${productIds.length} product IDs`);
        
        // Process products in batches to avoid overwhelming the API
        const batchSize = 10;
        
        for (let i = 0; i < 10; i += batchSize) {
            // for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize);
            console.log(`Processing batch ${i/batchSize + 1}, products ${i} to ${Math.min(i + batchSize - 1, productIds.length - 1)}`);
            
            // Process each product in the batch concurrently
            const batchResults = await Promise.all(
                batch.map(async (productId) => {
                    try {
                        // Get product data
                        const productData = await clients.catalogEvve.getProduct(productId);
                        
                        // Get SKUs for this product from our map
                        const skuIds = productSkuMap[productId.toString()] || [];
                        
                        // If there are SKUs, fetch their details
                        let skusWithInventory: SkuWithInventory[] = [];
                        if (skuIds.length > 0) {
                            // Get all SKUs for this product
                            const skus = await clients.catalogEvve.getSkusByProduct(productId);
                            
                            // For each SKU, get its inventory information
                            skusWithInventory = await Promise.all(
                                skus.map(async (sku) => {
                                    try {
                                        // Get inventory data for this SKU
                                        const inventory = await clients.catalogEvve.listInventoryBySku(sku.Id);
                                        
                                        // Calculate total inventory across all warehouses
                                        const totalInventory = inventory.balance.reduce(
                                            (sum, warehouse) => sum + warehouse.totalQuantity, 
                                            0
                                        );
                                        
                                        return {
                                            sku,
                                            totalInventory
                                        };
                                    } catch (error) {
                                        console.error(`Error fetching inventory for SKU ${sku.Id}:`, error);
                                        return {
                                            sku,
                                            totalInventory: 0
                                        };
                                    }
                                })
                            );
                        }
                        
                        console.log(`Product ${productId}: Found ${skusWithInventory.length} SKUs`);
                        return { productId, productData, skus: skusWithInventory };
                    } catch (error) {
                        console.error(`Error processing product ${productId}:`, error);
                        return { productId, productData: null, skus: [] };
                    }
                })
            );
            
            // Add batch results to the overall collection
            allProductSkus.push(...batchResults);
        }
        
        console.log(`Successfully processed ${allProductSkus.length} products`);
        console.log(`Total SKUs retrieved: ${allProductSkus.reduce((sum, product) => sum + product.skus.length, 0)}`);
        console.log(`Total inventory across all SKUs: ${allProductSkus.reduce(
            (sum, product) => sum + product.skus.reduce(
                (skuSum, skuWithInventory) => skuSum + skuWithInventory.totalInventory, 
                0
            ), 
            0
        )}`);
        
        // Log some sample product data for verification
        if (allProductSkus.length > 0) {
            const sampleProduct = allProductSkus[0];
            console.log(`Sample product data for ID ${sampleProduct.productId}:`, 
                        JSON.stringify(sampleProduct.productData).substring(0, 200) + '...');
        }
        
        // Here you can do additional processing with the SKU data if needed
        // For example, send it to another service or store it

        console.log(`ALL DATA ${JSON.stringify(allProductSkus)}`)
        
    } catch (error) {
        console.error(`Error in catalog sync:`, error);
        return {
            success: false,
            error: error.message
        };
    }

    return {
        success: true,
        productsProcessed: allProductSkus.length,
        totalSkus: allProductSkus.reduce((sum, product) => sum + product.skus.length, 0)
    };
  }
