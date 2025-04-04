import { Sku } from "../clients/catalog";

interface ProductSkus {
  productId: number;
  productData: any; // Store the product data
  skus: Sku[];
}

export const catalogSync = async (
    _: any,
    payload: any,
    ctx: Context
  ) => {
    const { clients } = ctx
    const allProductSkus: ProductSkus[] = [];
    
    try {
        console.log("Starting catalog sync process");
        // Get all product IDs
        const productIds = await clients.catalogEvve.getProductsIds();
        console.log(`Retrieved ${productIds.length} product IDs`);
        
        // Process products in batches to avoid overwhelming the API
        const batchSize = 10;
        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize);
            console.log(`Processing batch ${i/batchSize + 1}, products ${i} to ${Math.min(i + batchSize - 1, productIds.length - 1)}`);
            
            // Process each product in the batch concurrently
            const batchResults = await Promise.all(
                batch.map(async (productId) => {
                    try {
                        // Get both product data and SKUs concurrently
                        const [productData, skus] = await Promise.all([
                            clients.catalogEvve.getProduct(productId),
                            clients.catalogEvve.getSkusByProduct(productId)
                        ]);
                        
                        console.log(`Product ${productId}: Found ${skus.length} SKUs`);
                        return { productId, productData, skus };
                    } catch (error) {
                        console.error(`Error fetching SKUs for product ${productId}:`, error);
                        return { productId, skus: [] };
                    }
                })
            );
            
            // Add batch results to the overall collection
            allProductSkus.push(...batchResults);
        }
        
        console.log(`Successfully processed ${allProductSkus.length} products`);
        console.log(`Total SKUs retrieved: ${allProductSkus.reduce((sum, product) => sum + product.skus.length, 0)}`);
        
        // Log some sample product data for verification
        if (allProductSkus.length > 0) {
            const sampleProduct = allProductSkus[0];
            console.log(`Sample product data for ID ${sampleProduct.productId}:`, 
                        JSON.stringify(sampleProduct.productData).substring(0, 200) + '...');
        }
        
        // Here you can do additional processing with the SKU data if needed
        // For example, send it to another service or store it
        
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
