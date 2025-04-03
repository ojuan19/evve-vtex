
export const catalogSync = async (
    _: any,
    payload: any,
    ctx: Context
  ) => {
    const { clients } = ctx

    // console.log("WHAT IS THE CLIENT ",graphQLClient.query)


    try {
        // const productResult = await catalogGraphQL.sku(1661366)
        // console.log(`My Product ${(JSON.stringify(productResult))}`)
        console.log("HEY YO")
        const result =await clients.catalogEvve.getAllProductsAndSkus() 
        console.log(`My Result ${(JSON.stringify(result))}`)
    } catch (error) {
        console.log(`Error ${error}`)
    }
    console.log(`First param ${_}`)
    console.log(`My payload ${(JSON.stringify(payload))}`)
    // console.log(`My Result ${(JSON.stringify(result))}`)

    return {
        success: true,
    }
  }