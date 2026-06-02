import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmailClient } from "./client.js";
import { handleError } from "../../utils/errors.js";

export function registerGmailTools(server: McpServer) {
  server.tool(
    "gmail_search",
    "Search emails using Gmail query syntax",
    {
      query: z.string().describe("The Gmail search query (e.g. 'from:someone@example.com is:unread')"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)"),
      labelIds: z.array(z.string()).optional().describe("Only return messages with these label IDs")
    },
    async ({ query, maxResults, labelIds }) => {
      try {
        const gmail = await getGmailClient();
        const res = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: maxResults || 10,
          labelIds: labelIds
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data.messages || [], null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to search Gmail");
      }
    }
  );

  server.tool(
    "gmail_get_message",
    "Get full email content by ID",
    {
      messageId: z.string().describe("The ID of the message to retrieve"),
      format: z.enum(["full", "metadata", "minimal", "raw"]).optional().describe("The format to return the message in")
    },
    async ({ messageId, format }) => {
      try {
        const gmail = await getGmailClient();
        const res = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: format || "full"
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to get Gmail message");
      }
    }
  );

  server.tool(
    "gmail_send",
    "Compose and send a new email",
    {
      to: z.string().describe("Recipient email address(es)"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
      cc: z.string().optional().describe("CC recipient email address(es)"),
      bcc: z.string().optional().describe("BCC recipient email address(es)"),
      isHtml: z.boolean().optional().describe("Whether the body is HTML (default: false)")
    },
    async ({ to, subject, body, cc, bcc, isHtml }) => {
      try {
        const gmail = await getGmailClient();
        
        let message = `To: ${to}\n`;
        if (cc) message += `Cc: ${cc}\n`;
        if (bcc) message += `Bcc: ${bcc}\n`;
        message += `Subject: ${subject}\n`;
        message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"\n\n`;
        message += body;

        const encodedMessage = Buffer.from(message).toString('base64url');

        const res = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage
          }
        });
        
        return {
          content: [{ type: "text", text: `Email sent successfully. Message ID: ${res.data.id}` }]
        };
      } catch (error) {
        handleError(error, "Failed to send Gmail message");
      }
    }
  );

  server.tool(
    "gmail_reply",
    "Reply to an existing email thread",
    {
      messageId: z.string().describe("The ID of the message to reply to"),
      body: z.string().describe("Reply body content"),
      isHtml: z.boolean().optional().describe("Whether the body is HTML (default: false)")
    },
    async ({ messageId, body, isHtml }) => {
      try {
        const gmail = await getGmailClient();
        
        // Fetch the original message to get the Thread ID and Subject/To/Message-ID headers
        const originalMsg = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Message-ID", "References"]
        });

        const headers = originalMsg.data.payload?.headers || [];
        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || "";
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || "";
        const messageIdHeader = headers.find(h => h.name?.toLowerCase() === 'message-id')?.value || "";
        const referencesHeader = headers.find(h => h.name?.toLowerCase() === 'references')?.value || "";

        let subject = subjectHeader;
        if (!subject.toLowerCase().startsWith('re:')) {
          subject = `Re: ${subject}`;
        }

        const references = referencesHeader ? `${referencesHeader} ${messageIdHeader}` : messageIdHeader;

        let message = `To: ${fromHeader}\n`;
        message += `Subject: ${subject}\n`;
        message += `In-Reply-To: ${messageIdHeader}\n`;
        message += `References: ${references}\n`;
        message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"\n\n`;
        message += body;

        const encodedMessage = Buffer.from(message).toString('base64url');

        const res = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
            threadId: originalMsg.data.threadId
          }
        });

        return {
          content: [{ type: "text", text: `Reply sent successfully. Message ID: ${res.data.id}` }]
        };
      } catch (error) {
        handleError(error, "Failed to reply to Gmail message");
      }
    }
  );

  server.tool(
    "gmail_draft_create",
    "Create a draft email",
    {
      to: z.string().describe("Recipient email address(es)"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
      isHtml: z.boolean().optional().describe("Whether the body is HTML (default: false)")
    },
    async ({ to, subject, body, isHtml }) => {
      try {
        const gmail = await getGmailClient();
        
        let message = `To: ${to}\n`;
        message += `Subject: ${subject}\n`;
        message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"\n\n`;
        message += body;

        const encodedMessage = Buffer.from(message).toString('base64url');

        const res = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw: encodedMessage
            }
          }
        });

        return {
          content: [{ type: "text", text: `Draft created successfully. Draft ID: ${res.data.id}` }]
        };
      } catch (error) {
        handleError(error, "Failed to create Gmail draft");
      }
    }
  );

  server.tool(
    "gmail_label_list",
    "List all labels",
    {},
    async () => {
      try {
        const gmail = await getGmailClient();
        const res = await gmail.users.labels.list({
          userId: "me"
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data.labels || [], null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to list Gmail labels");
      }
    }
  );

  server.tool(
    "gmail_label_modify",
    "Add or remove labels from messages",
    {
      messageIds: z.array(z.string()).describe("List of message IDs to modify"),
      addLabelIds: z.array(z.string()).optional().describe("List of label IDs to add"),
      removeLabelIds: z.array(z.string()).optional().describe("List of label IDs to remove")
    },
    async ({ messageIds, addLabelIds, removeLabelIds }) => {
      try {
        const gmail = await getGmailClient();
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: {
            ids: messageIds,
            addLabelIds: addLabelIds || [],
            removeLabelIds: removeLabelIds || []
          }
        });
        return {
          content: [{ type: "text", text: "Labels modified successfully" }]
        };
      } catch (error) {
        handleError(error, "Failed to modify Gmail labels");
      }
    }
  );

  server.tool(
    "gmail_attachment_get",
    "Download an email attachment",
    {
      messageId: z.string().describe("The ID of the message containing the attachment"),
      attachmentId: z.string().describe("The ID of the attachment to download")
    },
    async ({ messageId, attachmentId }) => {
      try {
        const gmail = await getGmailClient();
        const res = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: messageId,
          id: attachmentId
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }]
        };
      } catch (error) {
        handleError(error, "Failed to download Gmail attachment");
      }
    }
  );
}
