import { IOClients } from "@vtex/api";
import OrdersClient from "./ordersClient";
import EvveClient from "./evveClient";
import { GraphQLServer } from "./graphqlClient";
import { CatalogClient } from "./catalog";

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
    public get orders() {
        return this.getOrSet("orders", OrdersClient);
      }
      public get evve() {
        return this.getOrSet("evve", EvveClient);
      }
      public get graphQLClient(){
        return this.getOrSet("graphQLClient", GraphQLServer);
      }
      public get catalogEvve(){
        return this.getOrSet("catalogEvve", CatalogClient);
      }
}
