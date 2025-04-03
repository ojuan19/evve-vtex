import { AppGraphQLClient, InstanceOptions, IOContext, RequestConfig, Serializable } from "@vtex/api"
export class GraphQLServer extends AppGraphQLClient {
  
    constructor(ctx: IOContext, opts?: InstanceOptions) {
      super('vtex.catalog-graphql@1.x', ctx, {
        ...opts,
        headers: {
          ...opts?.headers,
        },
      })
    }
  
    public query = async <TResponse extends Serializable, TArgs extends object>(
      query: string,
      variables: any,
      extensions: any,
      config: RequestConfig
    ) => {
      return this.graphql.query<TResponse, TArgs>(
        {
          extensions,
          query,
          variables,
        },
        {
          ...config,
          params: {
            ...config.params,
            locale: this.context.locale,
          },
        }
      )
    }
  }