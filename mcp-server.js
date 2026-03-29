#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const axios = require('axios');

// URL del servidor WhatsApp
const WHATSAPP_API = 'http://localhost:3000/api';

// Crear servidor MCP
const server = new Server(
  {
    name: 'whatsapp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Listar herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'whatsapp_status',
        description: 'Verificar estado de conexión de WhatsApp',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'whatsapp_list_chats',
        description: 'Listar todos los chats de WhatsApp',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Número máximo de chats a retornar',
              default: 50,
            },
          },
        },
      },
      {
        name: 'whatsapp_search_contacts',
        description: 'Buscar contactos por nombre o número',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Término de búsqueda (nombre o número)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'whatsapp_get_messages',
        description: 'Obtener mensajes de un chat específico',
        inputSchema: {
          type: 'object',
          properties: {
            chatId: {
              type: 'string',
              description: 'ID del chat (ej: 1234567890@s.whatsapp.net)',
            },
            limit: {
              type: 'number',
              description: 'Número de mensajes a obtener',
              default: 20,
            },
          },
          required: ['chatId'],
        },
      },
      {
        name: 'whatsapp_send_message',
        description: 'Enviar mensaje de WhatsApp a un contacto',
        inputSchema: {
          type: 'object',
          properties: {
            recipient: {
              type: 'string',
              description: 'Número de teléfono o JID del destinatario',
            },
            message: {
              type: 'string',
              description: 'Texto del mensaje a enviar',
            },
          },
          required: ['recipient', 'message'],
        },
      },
      {
        name: 'whatsapp_send_group_message',
        description: 'Enviar mensaje a un grupo de WhatsApp',
        inputSchema: {
          type: 'object',
          properties: {
            groupId: {
              type: 'string',
              description: 'ID del grupo (ej: 123456789@g.us)',
            },
            message: {
              type: 'string',
              description: 'Texto del mensaje a enviar',
            },
          },
          required: ['groupId', 'message'],
        },
      },
      {
        name: 'whatsapp_get_priority_messages',
        description: 'Obtener mensajes prioritarios del número 4426689053 que requieren atención',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'whatsapp_reply_priority',
        description: 'Enviar respuesta rápida al número prioritario 4426689053',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de respuesta a enviar',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

// Manejar llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'whatsapp_status': {
        const response = await axios.get(`${WHATSAPP_API}/status`);
        const status = response.data;
        
        if (status.connected) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ WhatsApp conectado\nUsuario: ${status.user?.id || 'N/A'}`,
              },
            ],
          };
        } else if (status.qrPending) {
          return {
            content: [
              {
                type: 'text',
                text: '⏳ Esperando escaneo de QR code. Por favor escanea el código mostrado en la terminal con tu teléfono.',
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: '❌ WhatsApp desconectado. Reinicia el servidor.',
              },
            ],
          };
        }
      }

      case 'whatsapp_list_chats': {
        const response = await axios.get(`${WHATSAPP_API}/chats`);
        const chats = response.data.chats;
        
        if (chats.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No se encontraron chats. Asegúrate de que WhatsApp esté conectado.',
              },
            ],
          };
        }
        
        const chatList = chats.map((c, i) => `${i + 1}. ${c.name} (${c.id})`).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `📱 Chats encontrados (${chats.length}):\n\n${chatList}`,
            },
          ],
        };
      }

      case 'whatsapp_search_contacts': {
        const response = await axios.get(`${WHATSAPP_API}/contacts/search?q=${encodeURIComponent(args.query)}`);
        const contacts = response.data.contacts;
        
        if (contacts.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No se encontraron contactos para: ${args.query}`,
              },
            ],
          };
        }
        
        const contactList = contacts.map((c, i) => `${i + 1}. ${c.name} - ${c.id}`).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `👥 Contactos encontrados (${contacts.length}):\n\n${contactList}`,
            },
          ],
        };
      }

      case 'whatsapp_get_messages': {
        const limit = args.limit || 20;
        const response = await axios.get(`${WHATSAPP_API}/messages/${encodeURIComponent(args.chatId)}?limit=${limit}`);
        const messages = response.data.messages;
        
        if (messages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No hay mensajes en este chat.',
              },
            ],
          };
        }
        
        const messageList = messages.map(m => {
          const date = new Date(m.timestamp * 1000).toLocaleString();
          const direction = m.fromMe ? '→' : '←';
          return `[${date}] ${direction} ${m.sender}: ${m.text}`;
        }).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `💬 Últimos ${messages.length} mensajes:\n\n${messageList}`,
            },
          ],
        };
      }

      case 'whatsapp_send_message': {
        const response = await axios.post(`${WHATSAPP_API}/send`, {
          recipient: args.recipient,
          message: args.message,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ Mensaje enviado exitosamente a ${args.recipient}\nID: ${response.data.messageId}`,
            },
          ],
        };
      }

      case 'whatsapp_send_group_message': {
        const response = await axios.post(`${WHATSAPP_API}/send-group`, {
          groupId: args.groupId,
          message: args.message,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ Mensaje enviado al grupo ${args.groupId}\nID: ${response.data.messageId}`,
            },
          ],
        };
      }

      case 'whatsapp_get_priority_messages': {
        const response = await axios.get(`${WHATSAPP_API}/priority-messages`);
        const data = response.data;
        
        if (data.unprocessedCount === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `📌 Número prioritario: 4426689053\n\n✅ No hay mensajes pendientes por procesar.\nTotal de mensajes prioritarios recibidos: ${data.totalPriorityMessages}`,
              },
            ],
          };
        }
        
        const messageList = data.messages.map(m => {
          const date = new Date(m.timestamp * 1000).toLocaleString();
          return `[${date}] ${m.sender}:\n${m.text}\n---`;
        }).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `🔔 MENSAJES PRIORITARIOS PENDIENTES (${data.unprocessedCount}):\n\n${messageList}\n\n📌 Número prioritario: 4426689053`,
            },
          ],
        };
      }

      case 'whatsapp_reply_priority': {
        const response = await axios.post(`${WHATSAPP_API}/priority-reply`, {
          message: args.message,
        });
        
        const results = response.data.results;
        const successCount = results.filter(r => r.success).length;
        
        return {
          content: [
            {
              type: 'text',
              text: `📤 Respuesta enviada al número prioritario 4426689053\n✅ Enviado a ${successCount} número(s)\n\nMensaje: ${args.message}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WhatsApp MCP Server iniciado en stdio');
}

main().catch(console.error);
