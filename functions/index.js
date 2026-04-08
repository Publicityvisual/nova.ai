/**
 * Nova AI v2.0 - Firebase Functions Backend
 * WhatsApp + Telegram AI Assistant 24/7
 * Powered by Gemini API (free tier)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

// ═══════════════════════════════════════════
// CONFIG - from Firebase environment
// ═══════════════════════════════════════════

function getConfig(key) {
  // Firebase Functions v2 uses process.env, v1 uses functions.config()
  const envKey = key.toUpperCase().replace(/\./g, "_");
  return process.env[envKey] || "";
}

const GEMINI_API_KEY = getConfig("GEMINI_API_KEY");
const TELEGRAM_BOT_TOKEN = getConfig("TELEGRAM_BOT_TOKEN");
const WHATSAPP_TOKEN = getConfig("WHATSAPP_TOKEN");
const WHATSAPP_VERIFY_TOKEN = getConfig("WHATSAPP_VERIFY_TOKEN") || "novaai_verify";
const WHATSAPP_PHONE_ID = getConfig("WHATSAPP_PHONE_ID");

// ═══════════════════════════════════════════
// GEMINI AI - The Brain
// ═══════════════════════════════════════════

async function askGemini(userMessage, conversationHistory, knowledgeBase) {
  if (!GEMINI_API_KEY) {
    return "Nova AI no tiene configurada la API de Gemini. Contacta al administrador.";
  }

  const systemPrompt = knowledgeBase
    ? `Eres Nova AI, un asistente inteligente para negocios. Responde siempre en el idioma del usuario.

INFORMACIÓN DEL NEGOCIO:
${knowledgeBase}

REGLAS:
- Responde basándote en la información del negocio proporcionada
- Si no sabes algo, di que consultarás con el equipo y responderás pronto
- Sé amable, profesional y conciso
- Usa el tono que el negocio indique
- Nunca inventes precios o servicios que no estén en la información`
    : `Eres Nova AI, un asistente inteligente. Responde de forma útil y concisa en el idioma del usuario.`;

  const contents = [];

  // Add conversation history (last 10 messages for context)
  const recentHistory = (conversationHistory || []).slice(-10);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
        },
      },
      { timeout: 30000 }
    );

    const candidate = response.data.candidates?.[0];
    if (!candidate) return "No pude generar una respuesta. Intenta de nuevo.";

    return candidate.content?.parts?.[0]?.text || "Respuesta vacía del modelo.";
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    return "Hubo un error procesando tu mensaje. Intenta de nuevo en un momento.";
  }
}

// ═══════════════════════════════════════════
// KNOWLEDGE BASE - Per-tenant business info
// ═══════════════════════════════════════════

async function getKnowledgeBase(tenantId) {
  try {
    const doc = await db.collection("tenants").doc(tenantId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return data.knowledgeBase || null;
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return null;
  }
}

async function getConversationHistory(tenantId, contactId) {
  try {
    const snapshot = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(contactId)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const messages = [];
    snapshot.forEach((doc) => messages.unshift(doc.data()));
    return messages;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

async function saveMessage(tenantId, contactId, role, content) {
  try {
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(contactId)
      .collection("messages")
      .add({
        role,
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Update conversation metadata
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(contactId)
      .set(
        {
          lastMessage: content.substring(0, 100),
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: admin.firestore.FieldValue.increment(1),
        },
        { merge: true }
      );
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

// ═══════════════════════════════════════════
// TELEGRAM BOT
// ═══════════════════════════════════════════

async function handleTelegramUpdate(update) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text;
  const userId = String(message.from.id);

  // Default tenant for Telegram is "default"
  const tenantId = "default";
  const contactId = `tg_${userId}`;

  let reply;

  if (text === "/start") {
    reply =
      "Hola! Soy Nova AI, tu asistente inteligente 24/7.\n\nEscríbeme cualquier cosa y te respondo al instante.";
  } else if (text === "/status") {
    reply = `Nova AI v2.0\nPlataforma: Firebase\nEstado: Online 24/7\nCerebro: Gemini 2.0 Flash`;
  } else {
    // Get knowledge base and history
    const knowledgeBase = await getKnowledgeBase(tenantId);
    const history = await getConversationHistory(tenantId, contactId);

    // Save user message
    await saveMessage(tenantId, contactId, "user", text);

    // Ask Gemini
    reply = await askGemini(text, history, knowledgeBase);

    // Save assistant reply
    await saveMessage(tenantId, contactId, "assistant", reply);
  }

  // Send reply via Telegram API
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: reply,
      parse_mode: "Markdown",
    }
  );
}

// ═══════════════════════════════════════════
// WHATSAPP WEBHOOK (Meta Cloud API)
// ═══════════════════════════════════════════

async function handleWhatsAppMessage(body) {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value?.messages) return; // Not a message event

  const message = value.messages[0];
  const from = message.from; // Phone number
  const phoneId = value.metadata?.phone_number_id;

  // Only handle text messages for now
  if (message.type !== "text") return;

  const text = message.text?.body;
  if (!text) return;

  // Find tenant by phone ID or use default
  let tenantId = "default";
  try {
    const tenantQuery = await db
      .collection("tenants")
      .where("whatsappPhoneId", "==", phoneId)
      .limit(1)
      .get();
    if (!tenantQuery.empty) {
      tenantId = tenantQuery.docs[0].id;
    }
  } catch (e) {
    console.error("Tenant lookup error:", e);
  }

  const contactId = `wa_${from}`;

  // Get knowledge base and conversation history
  const knowledgeBase = await getKnowledgeBase(tenantId);
  const history = await getConversationHistory(tenantId, contactId);

  // Save user message
  await saveMessage(tenantId, contactId, "user", text);

  // Ask Gemini
  const reply = await askGemini(text, history, knowledgeBase);

  // Save assistant reply
  await saveMessage(tenantId, contactId, "assistant", reply);

  // Send reply via WhatsApp API
  const token = await getTenantWhatsAppToken(tenantId);
  await axios.post(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to: from,
      type: "text",
      text: { body: reply },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

async function getTenantWhatsAppToken(tenantId) {
  try {
    const doc = await db.collection("tenants").doc(tenantId).get();
    return doc.data()?.whatsappToken || WHATSAPP_TOKEN;
  } catch (e) {
    return WHATSAPP_TOKEN;
  }
}

// ═══════════════════════════════════════════
// EXPRESS API
// ═══════════════════════════════════════════

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    version: "2.0.0",
    platform: "firebase",
    ai: GEMINI_API_KEY ? "gemini" : "not configured",
    telegram: TELEGRAM_BOT_TOKEN ? "configured" : "not configured",
    whatsapp: WHATSAPP_TOKEN ? "configured" : "not configured",
  });
});

// WhatsApp webhook verification (GET)
app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// WhatsApp webhook messages (POST)
app.post("/webhook/whatsapp", async (req, res) => {
  try {
    await handleWhatsAppMessage(req.body);
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
  }
  res.sendStatus(200); // Always return 200 to Meta
});

// Telegram webhook (POST)
app.post("/webhook/telegram", async (req, res) => {
  try {
    await handleTelegramUpdate(req.body);
  } catch (error) {
    console.error("Telegram webhook error:", error);
  }
  res.sendStatus(200);
});

// API: Chat endpoint (for web/mobile clients)
app.post("/api/chat", async (req, res) => {
  const { message, tenantId = "default", contactId = "web_anonymous" } = req.body;

  if (!message) return res.status(400).json({ error: "message required" });

  const knowledgeBase = await getKnowledgeBase(tenantId);
  const history = await getConversationHistory(tenantId, contactId);

  await saveMessage(tenantId, contactId, "user", message);
  const reply = await askGemini(message, history, knowledgeBase);
  await saveMessage(tenantId, contactId, "assistant", reply);

  res.json({ reply, tenantId });
});

// API: Set knowledge base for a tenant
app.post("/api/tenant/knowledge", async (req, res) => {
  const { tenantId, knowledgeBase, businessName, tone } = req.body;

  if (!tenantId || !knowledgeBase) {
    return res.status(400).json({ error: "tenantId and knowledgeBase required" });
  }

  await db.collection("tenants").doc(tenantId).set(
    {
      businessName: businessName || tenantId,
      knowledgeBase,
      tone: tone || "profesional y amigable",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  res.json({ success: true, tenantId });
});

// ═══════════════════════════════════════════
// FIREBASE FUNCTIONS EXPORTS
// ═══════════════════════════════════════════

// Main API (handles all routes)
exports.api = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onRequest(app);

// Health check (separate for monitoring)
exports.health = functions.https.onRequest((req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString(), version: "2.0.0" });
});
