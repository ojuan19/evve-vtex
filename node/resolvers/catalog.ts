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
  try {
    const productSkuMap = await clients.catalogEvve.getAllProductsAndSkuIds();
    const productIds = Object.keys(productSkuMap).map(id => parseInt(id, 10));
    console.log(`Retrieved ${productIds.length} product IDs`);
    return { productSkuMap, productIds };
  } catch (error) {
    console.error("Error fetching product and SKU IDs:", error);
    // Return empty data to allow the process to continue
    return { productSkuMap: {}, productIds: [] };
  }
};

/**
 * Fetches detailed information for a single SKU
 */
const fetchSkuDetails = async (sku: Sku, clients: Context['clients'], accountName: string): Promise<SkuWithInventory> => {
  // Initialize default values
  let totalInventory = 0;
  let costPrice = null;
  let imageUrls: string[] = [];

  // Fetch inventory data with error handling
  try {
    const inventory = await clients.catalogEvve.listInventoryBySku(sku.Id);
    totalInventory = inventory.balance.reduce(
      (sum, warehouse) => sum + warehouse.totalQuantity, 
      0
    );
  } catch (error) {
    console.error(`Error fetching inventory for SKU ${sku.Id}:`, error);
    // Continue with default inventory value
  }

  // Fetch price data with error handling
  try {
    const price = await clients.catalogEvve.getPriceBySku(sku.Id);
    costPrice = price ? price.costPrice : null;
  } catch (error) {
    console.error(`Error fetching price for SKU ${sku.Id}:`, error);
    // Continue with default price value
  }

  // Fetch image data with error handling
  try {
    const images = await clients.catalogEvve.getImagesBySku(sku.Id);
    imageUrls = images.map(image => 
      `https://${accountName}.${image.FileLocation}`
    );
  } catch (error) {
    console.error(`Error fetching images for SKU ${sku.Id}:`, error);
    // Continue with default empty images array
  }
  
  return {
    sku,
    totalInventory,
    costPrice,
    imageUrls
  };
};

/**
 * Processes a single product and its SKUs
 */
const processProduct = async (productId: number, skuIds: number[], clients: Context['clients'], accountName: string): Promise<ProductSkus> => {
  let productData: Product | null = null;
  let skusWithInventory: SkuWithInventory[] = [];
  
  // Get product data with error handling
  try {
    productData = await clients.catalogEvve.getProduct(productId);
  } catch (error) {
    console.error(`Error fetching product data for ${productId}:`, error);
    // Continue with null product data
  }
  
  // If there are SKUs, fetch their details
  if (skuIds.length > 0) {
    try {
      // Get all SKUs for this product
      const skus = await clients.catalogEvve.getSkusByProduct(productId);
      
      // For each SKU, get its details
      // Process each SKU individually so one failure doesn't affect others
      for (const sku of skus) {
        try {
          const skuDetails = await fetchSkuDetails(sku, clients, accountName);
          skusWithInventory.push(skuDetails);
        } catch (error) {
          console.error(`Error processing SKU ${sku.Id}:`, error);
          // Add SKU with default values
          skusWithInventory.push({
            sku,
            totalInventory: 0,
            costPrice: null,
            imageUrls: []
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching SKUs for product ${productId}:`, error);
      // Continue with empty SKUs array
    }
  }
  
  console.log(`Product ${productId}: Found ${skusWithInventory.length} SKUs`);
  return { productId, productData, skus: skusWithInventory };
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
    
    // Process only if we have product IDs
    if (productIds.length === 0) {
      console.log("No product IDs found to process");
      return {
        success: false,
        error: "No product IDs found to process",
        productsProcessed: 0,
        totalSkus: 0,
        syncedWithEvve: 0
      };
    }
    
    // Uncomment for production use
    // for (let i = 0; i < productIds.length; i += batchSize) {
    // For testing, limit to first 10 products
    for (let i = 0; i < Math.min(10, productIds.length); i += batchSize) {
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
              console.log(`Sending product ${productData.productId} to Evve`);
              try {
                await clients.evve.saveProductAndVariants(evveProduct);
                syncedWithEvve.push(productData.productId);
                console.log(`Successfully synced product ${productData.productId} with Evve`);
              } catch (evveError) {
                console.error(`Error sending product ${productData.productId} to Evve API:`, evveError);
                // Continue with next product
              }
            }
          } catch (error) {
            console.error(`Error converting product ${productData.productId} to Evve format:`, error);
            // Continue with next product
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
