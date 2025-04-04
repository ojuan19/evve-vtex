import { Product, Sku } from "../clients/catalog";
import { ProductAttribute, ProductImage, ProductPayload, ProductVariant } from "../clients/evveClient";

interface SkuWithInventory {
  sku: Sku;
  totalInventory: number;
  costPrice: number | null;
  imageUrls: string[];
}

interface ProductSkus {
  productId: number;
  productData: Product | null;
  skus: SkuWithInventory[];
}

/**
 * Fetches all product and SKU IDs from the catalog
 */
const fetchProductAndSkuIds = async (clients: Context['clients']) => {
  console.log("Fetching all product and SKU IDs...");
  const productSkuMap = await clients.catalogEvve.getAllProductsAndSkuIds();
  const productIds = Object.keys(productSkuMap).map(id => parseInt(id, 10));
  console.log(`Retrieved ${productIds.length} product IDs`);
  return { productSkuMap, productIds };
};

/**
 * Fetches detailed information for a single SKU
 */
const fetchSkuDetails = async (sku: Sku, clients: Context['clients'], accountName: string): Promise<SkuWithInventory> => {
  try {
    // Get inventory data, price data, and images for this SKU concurrently
    const [inventory, price, images] = await Promise.all([
      clients.catalogEvve.listInventoryBySku(sku.Id),
      clients.catalogEvve.getPriceBySku(sku.Id),
      clients.catalogEvve.getImagesBySku(sku.Id)
    ]);
    
    // Calculate total inventory across all warehouses
    const totalInventory = inventory.balance.reduce(
      (sum, warehouse) => sum + warehouse.totalQuantity, 
      0
    );
    
    // Transform image URLs to the required format
    const imageUrls = images.map(image => 
      `https://${accountName}.${image.FileLocation}`
    );
    
    return {
      sku,
      totalInventory,
      costPrice: price ? price.costPrice : null,
      imageUrls
    };
  } catch (error) {
    console.error(`Error fetching details for SKU ${sku.Id}:`, error);
    return {
      sku,
      totalInventory: 0,
      costPrice: null,
      imageUrls: []
    };
  }
};

/**
 * Processes a single product and its SKUs
 */
const processProduct = async (productId: number, skuIds: number[], clients: Context['clients'], accountName: string): Promise<ProductSkus> => {
  try {
    // Get product data
    const productData = await clients.catalogEvve.getProduct(productId);
    
    // If there are SKUs, fetch their details
    let skusWithInventory: SkuWithInventory[] = [];
    if (skuIds.length > 0) {
      // Get all SKUs for this product
      const skus = await clients.catalogEvve.getSkusByProduct(productId);
      
      // For each SKU, get its details
      skusWithInventory = await Promise.all(
        skus.map(sku => fetchSkuDetails(sku, clients, accountName))
      );
    }
    
    console.log(`Product ${productId}: Found ${skusWithInventory.length} SKUs`);
    return { productId, productData, skus: skusWithInventory };
  } catch (error) {
    console.error(`Error processing product ${productId}:`, error);
    return { productId, productData: null, skus: [] };
  }
};

/**
 * Converts VTEX product and SKU data to Evve format
 */
const convertToEvveFormat = (productData: ProductSkus): ProductPayload | null => {
  if (!productData.productData) return null;
  
  const product = productData.productData;
  
  // Map SKUs to variants
  const variants: ProductVariant[] = productData.skus.map(skuData => {
    // Create attributes from SKU name (simplified approach)
    const attributes: ProductAttribute[] = [];
    
    // Create images from SKU image URLs
    const images: ProductImage[] = skuData.imageUrls.map(url => ({
      url,
      alt: `Image for ${skuData.sku.Name}`
    }));
    
    return {
      code: skuData.sku.Id,
      name: skuData.sku.Name,
      price: skuData.costPrice || 0,
      stock: skuData.totalInventory,
      attributes,
      images
    };
  });
  
  return {
    code: product.Id,
    name: product.Name,
    brand_name: `Brand ${product.BrandId}`, // Simplified, ideally we'd fetch the actual brand name
    short_description: product.DescriptionShort || product.Title,
    detailed_description: product.Description || product.MetaTagDescription || "",
    variants
  };
};

/**
 * Logs statistics about the processed products and SKUs
 */
const logStatistics = (allProductSkus: ProductSkus[]) => {
  console.log(`Successfully processed ${allProductSkus.length} products`);
  console.log(`Total SKUs retrieved: ${allProductSkus.reduce((sum, product) => sum + product.skus.length, 0)}`);
  
  // Log inventory statistics
  const totalInventory = allProductSkus.reduce(
    (sum, product) => sum + product.skus.reduce(
      (skuSum, skuWithInventory) => skuSum + skuWithInventory.totalInventory, 
      0
    ), 
    0
  );
  console.log(`Total inventory across all SKUs: ${totalInventory}`);
  
  // Log price statistics
  const skusWithPrice = allProductSkus.flatMap(product => 
    product.skus.filter(skuData => skuData.costPrice !== null)
  );
  const totalCostPrice = skusWithPrice.reduce(
    (sum, skuData) => sum + (skuData.costPrice || 0), 
    0
  );
  const averageCostPrice = skusWithPrice.length > 0 
    ? totalCostPrice / skusWithPrice.length 
    : 0;
  console.log(`Average cost price across ${skusWithPrice.length} SKUs: ${averageCostPrice.toFixed(2)}`);
  
  // Log image statistics
  const totalImages = allProductSkus.reduce(
    (sum, product) => sum + product.skus.reduce(
      (skuSum, skuWithInventory) => skuSum + skuWithInventory.imageUrls.length, 
      0
    ), 
    0
  );
  console.log(`Total images across all SKUs: ${totalImages}`);
  
  // Log sample product data
  if (allProductSkus.length > 0) {
    const sampleProduct = allProductSkus[0];
    console.log(`Sample product data for ID ${sampleProduct.productId}:`, 
      JSON.stringify(sampleProduct.productData).substring(0, 200) + '...');
  }
};

/**
 * Main catalog sync function
 */
export const catalogSync = async (
  _: any,
  _payload: any,
  ctx: Context
) => {
  const { clients } = ctx;
  const allProductSkus: ProductSkus[] = [];
  const syncedWithEvve: number[] = [];
  
  try {
    console.log("Starting catalog sync process");
    
    // Get all product IDs and their associated SKU IDs
    const { productSkuMap, productIds } = await fetchProductAndSkuIds(clients);
    
    // Process products in batches to avoid overwhelming the API
    const batchSize = 10;
    
    for (let i = 0; i < 10; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1}, products ${i} to ${Math.min(i + batchSize - 1, productIds.length - 1)}`);
      
      // Process each product in the batch concurrently
      const batchResults = await Promise.all(
        batch.map(async (productId) => {
          const skuIds = productSkuMap[productId.toString()] || [];
          return processProduct(productId, skuIds, clients, ctx.vtex.account);
        })
      );
      
      // Add batch results to the overall collection
      allProductSkus.push(...batchResults);
      
      // Send products to Evve
      for (const productData of batchResults) {
        if (productData.productData && productData.skus.length > 0) {
          try {
            const evveProduct = convertToEvveFormat(productData);
            if (evveProduct) {
            console.log(`Sending product ${JSON.stringify(evveProduct)} `)
            //   await clients.evve.saveProductAndVariants(evveProduct);
              syncedWithEvve.push(productData.productId);
              console.log(`Successfully synced product ${productData.productId} with Evve`);
            }
          } catch (error) {
            console.error(`Error syncing product ${productData.productId} with Evve:`, error);
          }
        }
      }
    }
    
    // Log statistics about the processed data
    logStatistics(allProductSkus);
    
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
    totalSkus: allProductSkus.reduce((sum, product) => sum + product.skus.length, 0),
    syncedWithEvve: syncedWithEvve.length
  };
};
