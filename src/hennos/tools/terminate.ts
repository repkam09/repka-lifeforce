import { RealtimeFunctionTool } from "openai/resources/realtime/realtime";
import { WebSocket } from "ws";
import { Logger } from "../../utils/logger";

export class TerminateCall {
  public static definition(): RealtimeFunctionTool {
    return {
      type: "function",
      name: "terminate_session",
      description:
        "Use this tool to end the chat when the user indicates that their questions are answered, the conversation reaches a natural conclusion, or if the user says goodbye.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "The reason for ending the call.",
          },
        },
        required: ["reason"],
      },
    };
  }

  public static async callback(
    socket: WebSocket,
    callId: string,
    args: Record<string, string>
  ): Promise<void> {
    // Log the reason for ending the call
    if (args.reason) {
      Logger.info(`SIP Ending call_id ${callId}: ${args.reason}`);
    } else {
      Logger.info(`SIP Ending call_id ${callId} with no reason provided`);
    }
    // Acknowledge the function call
    socket.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: "terminate_session",
        },
      })
    );
  }
}
