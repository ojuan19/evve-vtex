export async function someStates(
  ctx: StatusChangeContext,
  next: () => Promise<any>
) {
  console.log('HELLO')
  const orderResponse = await ctx.clients.orders.getOrder(ctx.body.orderId)
  await ctx.clients.evve.saveOrder({
    platform: 'vtex',
    order: orderResponse
  })
  await next()
}
