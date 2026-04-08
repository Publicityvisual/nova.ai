# Nova AI v2.0

AI assistant for WhatsApp & Telegram. Runs 24/7 on Firebase, powered by Gemini.

## Setup

1. Get a [Gemini API key](https://aistudio.google.com/app/apikey) (free)
2. Create a [Telegram Bot](https://t.me/BotFather) (free)
3. Set up [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api) (free tier)

```bash
# Set environment variables
firebase functions:config:set \
  gemini.api_key="YOUR_KEY" \
  telegram.bot_token="YOUR_TOKEN" \
  whatsapp.token="YOUR_TOKEN" \
  whatsapp.verify_token="novaai_verify" \
  whatsapp.phone_id="YOUR_PHONE_ID"

# Deploy
cd functions && npm install && cd ..
firebase deploy
```

## Webhooks

After deploy, configure:

- **Telegram**: `https://novaai-38a4e.web.app/webhook/telegram`
- **WhatsApp**: `https://novaai-38a4e.web.app/webhook/whatsapp`

## Architecture

```
WhatsApp/Telegram -> Firebase Functions -> Gemini API -> Response
                          |
                    Firestore (memory + knowledge base)
```

## API

```bash
# Chat
curl -X POST https://novaai-38a4e.web.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "tenantId": "default"}'

# Set knowledge base
curl -X POST https://novaai-38a4e.web.app/api/tenant/knowledge \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "djkoveck", "businessName": "DJ KOVECK", "knowledgeBase": "..."}'
```

## License

MIT
