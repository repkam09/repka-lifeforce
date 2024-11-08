/* eslint-disable @typescript-eslint/no-explicit-any */
import KoaRouter from "koa-router";

export type LifeforcePluginEndpoint = {
  path: string;
  type: "GET" | "POST";
  cacheTTL?: number;
  handler: KoaRouter.IMiddleware<any, any>;
};

export abstract class LifeforcePlugin {
  private router: KoaRouter;

  constructor(router: KoaRouter) {
    this.router = router;
  }

  public addHandlers(endpoints: LifeforcePluginEndpoint[]): void {
    const router = this.router;
    endpoints.forEach((endpoint) => {
      router.register(endpoint.path, [endpoint.type], endpoint.handler);
    });
  }

  public abstract init(): void;
}
