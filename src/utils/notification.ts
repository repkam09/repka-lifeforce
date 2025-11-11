import { Config } from "./config";
import { Logger } from "./logger";

export async function sendNotification(message: string) {
  if (Config.LIFEFORCE_DEBUG_MODE) {
    Logger.info(`Notification Skipped: ${message}`);
    return;
  }

  try {
    Config.TELEGRAM_BOT_NOTIFY.forEach(async (chatId: string) => {
      const telegramUrl = `https://api.telegram.org/bot${Config.TELEGRAM_BOT_KEY}/sendMessage`;
      const telegramBody = {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      };

      const result = await fetch(telegramUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telegramBody),
      });

      if (!result.ok) {
        const errorText = await result.text();
        Logger.error(
          `Notification Error - ${chatId}: ${result.status} - ${errorText}`
        );
      } else {
        Logger.info(`Notification Success - ${chatId}`);
      }
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error(`Notification Error: ${error.message}`);
  }
}
