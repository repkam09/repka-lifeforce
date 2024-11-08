import fs from "node:fs";
import path from "node:path";
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";

export class ElectionResults extends LifeforcePlugin {
  public init(): void {
    console.log("ElectionResults initialized");
  }

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/election/full",
        type: "GET",
        handler: handleElectionResults,
      },
    ]);
  }
}

function handleElectionResults(ctx: Context, next: Next) {
  // This used to be dynamic and updated from CNN website, but since election
  // is now over, use a static file to give results. Faster and more reliable since
  // the information is no longer changing.
  const filePath = path.join(__dirname, "../static/election_results.json");
  const electionResults = JSON.parse(fs.readFileSync(filePath, "utf8"));

  ctx.status = 200;
  ctx.body = electionResults;

  return next();
}
