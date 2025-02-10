/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "koa";
import KoaRouter from "koa-router";
import { LifeforcePlugin } from "../utils/LifeforcePlugin";
import nodemailer, { Transporter } from "nodemailer";
import { Config } from "../utils/config";
import { Logger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";

const TEMP_THRESHOLD = 45;
const TEMP_CHECKIN_INTERVAL = 1000 * 60 * 30; // 30 minutes

type TempResponseEntry = {
  _id: string;
  clientid: string;
  temp: number;
  threshold: number;
  checkinTime: string;
};

export class RaspiTempMonitor extends LifeforcePlugin {
  private transport: Transporter;
  private prisma: PrismaClient;
  private tempCheckinTimers: Record<string, NodeJS.Timeout> = {};

  public async init(): Promise<void> {
    Logger.info("Initializing TempMon Plugin");
  }

  constructor(router: KoaRouter, prisma: PrismaClient) {
    super(router);
    this.prisma = prisma;
    this.addHandlers([
      {
        path: "/api/temp/checkin",
        type: "POST",
        handler: this.handleTempCheckinNew.bind(this),
      },
      {
        path: "/api/temp/history/:clientid",
        type: "GET",
        handler: this.handleGetTempHistory.bind(this),
      },
      {
        path: "/api/temp/remove/:clientid",
        type: "GET",
        handler: this.handleRemoveClient.bind(this),
      },
      {
        path: "/api/temp/clients",
        type: "GET",
        handler: this.handleGetClients.bind(this),
      },
    ]);

    this.transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Config.LIFEFORCE_EMAIL_USER,
        pass: Config.LIFEFORCE_EMAIL_PASS,
      },
    });
  }

  private async handleGetClients(ctx: Context, next: Next) {
    ctx.status = 200;
    ctx.body = await this.fetchClientList();
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
      const clientId = ctx.params.clientid as string;

      if (this.tempCheckinTimers[clientId]) {
        Logger.info(`Clearing timer for ${clientId} due to removal`);
        clearInterval(this.tempCheckinTimers[clientId]);
      }

      await this.setClientDeleted(clientId);

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
      if (this.tempCheckinTimers[body.clientid]) {
        Logger.info(`Clearing timer for ${body.clientid} due to checkin`);
        clearInterval(this.tempCheckinTimers[body.clientid]);
      }

      // Set up a new timer
      Logger.info(`Setting timer for ${body.clientid}`);
      this.tempCheckinTimers[body.clientid] = setInterval(async () => {
        await this.alertTimeoutError(body.clientid);
      }, TEMP_CHECKIN_INTERVAL);

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

  private async setClientDeleted(clientId: string) {
    try {
      await this.prisma.tempreatureClient.update({
        where: { clientId },
        data: { deleted: true },
      });
    } catch {
      Logger.error(`Error deleting client: ${clientId}`);
    }
  }

  private async upsertCheckinRecord(clientId: string, temp: number) {
    const client = await this.prisma.tempreatureClient.upsert({
      where: { clientId },
      update: { updatedAt: new Date() },
      create: {
        clientId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        clientId: true,
      },
    });

    await this.prisma.tempreatureCheckin.create({
      data: {
        tempreature: temp,
        threshold: TEMP_THRESHOLD,
        clientId: client.clientId,
        createdAt: new Date(),
      },
    });
  }

  private async fetchCheckinRecords(
    clientId: string
  ): Promise<TempResponseEntry[]> {
    const records = await this.prisma.tempreatureCheckin.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });

    return records.map((record) => {
      return {
        _id: record.id,
        checkinTime: record.createdAt.toISOString(),
        clientid: record.clientId,
        threshold: record.threshold,
        temp: record.tempreature,
      };
    });
  }

  private async fetchClientList(): Promise<string[]> {
    const clients = await this.prisma.tempreatureClient.findMany({
      select: {
        clientId: true,
      },
      where: {
        deleted: false,
      },
    });

    return clients.map((client) => client.clientId);
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
    if (Config.LIFEFORCE_DEBUG_MODE || Config.LIFEFORCE_SKIP_EMAIL) {
      Logger.info(`Skipping email sending: \n${subject} \n\n ${message}`);
      return;
    }

    try {
      await this.transport.sendMail({
        from: Config.LIFEFORCE_EMAIL_USER,
        to: Config.LIFEFORCE_EMAIL_NOTIFY,
        subject,
        text: message,
      });
    } catch (err: unknown) {
      const error = err as Error;
      Logger.error(`Error sending email: ${error.message}`);
    }
  }
}
