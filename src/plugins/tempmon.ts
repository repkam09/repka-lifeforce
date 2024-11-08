import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { MongoClient } from "mongodb";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import nodemailer, { Transporter } from "nodemailer";
import { Config } from "../utils/config";

const TEMP_THRESHOLD = 45;

export class RaspiTempMonitor extends LifeforcePlugin {
  public init(): void {
    console.log("Temp Monitor initialized");
  }

  private transport: Transporter;
  private mongo: MongoClient;
  private tempCheckinTimers: Record<string, NodeJS.Timeout> = {};

  constructor(router: KoaRouter) {
    super(router);
    this.addHandlers([
      {
        path: "/api/temp/checkin",
        type: "POST",
        handler: this.handleTempCheckinNew,
      },
      {
        path: "/api/temp/history/:clientid",
        type: "GET",
        handler: this.handleGetTempHistory,
      },
      {
        path: "/api/temp/remove/:clientid",
        type: "GET",
        handler: this.handleRemoveClient,
      },
      {
        path: "/api/temp/clients",
        type: "GET",
        handler: this.handleGetClients,
      },
    ]);

    this.transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Config.LIFEFORCE_EMAIL_USER,
        pass: Config.LIFEFORCE_EMAIL_PASS,
      },
    });

    this.mongo = new MongoClient("mongodb://localhost:27017", {});
  }

  private handleGetClients(ctx: Context, next: Next) {
    const clients = Object.keys({});
    ctx.status = 200;
    ctx.body = clients;

    return next();
  }

  private async handleGetTempHistory(ctx: Context, next: Next) {
    if (ctx.params && ctx.params.clientid) {
      const result = await this.fetchCheckinRecords(ctx.params.clientid);
      ctx.status = 200;
      ctx.body = result;
    }

    return next();
  }

  private async handleRemoveClient(ctx: Context, next: Next) {
    if (ctx.params && ctx.params.clientid) {
      const clientId = ctx.params.clientid;

      if (this.tempCheckinTimers[clientId]) {
        clearTimeout(this.tempCheckinTimers[clientId]);
      }

      ctx.status = 200;
      ctx.body = { error: false, removed: clientId };

      return next();
    }
  }

  private async handleTempCheckinNew(ctx: Context, next: Next) {
    if (ctx.request.body) {
      const body = ctx.request.body as { clientid: string; temp: number };
      if (!body.clientid || !body.temp) {
        ctx.status = 400;
        ctx.body = "Bad Request";
        return next();
      }

      // clear the timer
      clearTimeout(this.tempCheckinTimers[body.clientid]);

      // Set up a new timer
      this.tempCheckinTimers[body.clientid] = setTimeout(async () => {
        await this.alertTimeoutError(body.clientid);
      }, 60000);

      await this.upsertCheckinRecord(body.clientid, body.temp);

      // check if our threshold is met
      if (body.temp < TEMP_THRESHOLD) {
        await this.alertColdTempError(body.clientid, body.temp);
      }

      ctx.status = 200;
      ctx.body = "OK";
      return next();
    }
  }

  private async upsertCheckinRecord(clientid: string, temp: number) {
    const mongo = await this.mongo.connect();

    const database = mongo.db("tempmon");
    await database.collection("temphistory").insertOne({
      clientid,
      temp,
      threshold: TEMP_THRESHOLD,
      checkinTime: new Date(),
    });

    await mongo.close();
  }

  private async fetchCheckinRecords(clientid: string): Promise<any[]> {
    const mongo = await this.mongo.connect();

    const database = mongo.db("tempmon");
    const result = await database
      .collection("temphistory")
      .find({ clientid })
      .sort({ $natural: -1 })
      .limit(48)
      .toArray();

    await mongo.close();

    return result;
  }

  private async alertColdTempError(clientid: string, temp: number) {
    const subject = `Cold Temp Alert - ${clientid} - ${new Date().toISOString()}`;
    const message = `Tempreature Monitor Alert! 

        Name: ${clientid}
        Time: ${new Date().toISOString()}
        Temp: ${temp}

        This is an alert that the checkin for ${clientid} was ${temp}. This is below the warning threshold of ${TEMP_THRESHOLD}! 
        Please try and verify that this reading is correct!
        
        This is an automated message.
        `;

    return this.sendMailMessage(subject, message);
  }

  private async alertTimeoutError(clientid: string) {
    const subject = `Missed Checkin Alert - ${clientid} - ${new Date().toISOString()}`;
    const message = `Tempreature Monitor Alert! 

        Name: ${clientid}
        Time: ${new Date().toISOString()}

        This is an alert that the client ${clientid} missed a scheduled checkin. This might mean that the system cannot access the internet or has powered off unexpectedly!
        Please try and verify this. 
        
        This is an automated message.
        `;

    return this.sendMailMessage(subject, message);
  }

  private async sendMailMessage(subject: string, message: string) {
    try {
      await this.transport.sendMail({
        from: Config.LIFEFORCE_EMAIL_USER,
        to: Config.LIFEFORCE_EMAIL_NOTIFY,
        subject,
        text: message,
      });
    } catch (err: unknown) {
      console.error(err);
    }
  }
}
