# NovaAI - Modelos Sin Censura (Uncensored Models)

## ¿Qué significa "Sin Censura" en NovaAI?

Nuestros modelos "sin censura" permiten discusión abierta y honesta de temas que otros sistemas suelen restringir artificialmente:

### ✅ Temas PERMITIDOS:
- **Política** - Análisis de ideologías, sistemas de gobierno
- **Religión** - Discusión filosófica y teológica
- **Filosofía** - Ética, moral, existencialismo
- **Historia** - Eventos controvertidos, análisis histórico
- **Medicina** - Información médica general (no diagnósticos)
- **Seguridad informática** - Research ético, análisis de vulnerabilidades
- **Economía** - Análisis de mercados, críticas al sistema financiero
- **Conspiraciones** - Análisis crítico, debunking o exploración

### ❌ Temas PROHIBIDOS (Siempre):
- ❌ Contenido sexual explícito o pornografía
- ❌ Instrucciones para crear armas químicas/biológicas
- ❌ Grooming o contenido que dañe menores
- ❌ Doxxing o acoso coordinado
- ❌ Contenido ilegal según leyes internacionales

---

## Modelos Disponibles

### 1. `nova-uncensored` (Recomendado)
**Base:** Hermes 3 Llama 3.1 405B
- Sin filtros corporativos
- Respuestas directas y honestas
- Ideal para análisis crítico
- Contexto: 128K tokens

```bash
curl https://novaai-38a4e.web.app/v1/chat/completions \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nova-uncensored",
    "messages": [
      {"role": "user", "content": "Explica diferentes perspectivas sobre el capitalismo vs socialismo"}
    ],
    "temperature": 0.8
  }'
```

### 2. `nova-creative`
**Base:** MythoMax L2 13B
- Especializado en storytelling sin restricciones
- Roleplay y creatividad
- Contexto: 8K tokens

### 3. Modelos Locales (Ollama)
**Recomendados para máxima privacidad:**
- `llama3.1` - Configurable localmente
- `mistral` - Rápido y eficiente
- `deepseek-r1` - Razonamiento avanzado

---

## Ejemplos de Uso

### Ejemplo 1: Análisis Político
```json
{
  "model": "nova-uncensored",
  "messages": [
    {"role": "system", "content": "Eres un analista político objetivo que presenta múltiples perspectivas."},
    {"role": "user", "content": "¿Cuáles son los pros y contras del sistema democrático actual?"}
  ]
}
```

### Ejemplo 2: Discusión Filosófica
```json
{
  "model": "nova-uncensored",
  "messages": [
    {"role": "user", "content": "Explícame el concepto de nihilismo y sus implicaciones éticas"}
  ],
  "temperature": 0.9
}
```

### Ejemplo 3: Investigación Histórica
```json
{
  "model": "nova-uncensored",
  "messages": [
    {"role": "user", "content": "Analiza las diferentes interpretaciones históricas de la Revolución Industrial"}
  ]
}
```

### Ejemplo 4: Debate de Ideas
```json
{
  "model": "nova-uncensored",
  "messages": [
    {"role": "system", "content": "Presenta argumentos de ambos lados sin tomar posición."},
    {"role": "user", "content": "¿El libre mercado realmente beneficia a todos?"}
  ]
}
```

---

## Comparativa: Censurado vs Sin Censura

### ❌ Modelo Censurado (Corporativo)
**Usuario:** "¿Cuáles son las críticas al sistema bancario actual?"

**Respuesta:** *"El sistema bancario tiene aspectos positivos y negativos. Es importante consultar múltiples fuentes..."* (Respuesta vaga)

### ✅ Modelo Sin Censura (NovaAI)
**Usuario:** "¿Cuáles son las críticas al sistema bancario actual?"

**Respuesta:** *"Las principales críticas incluyen:
1. **Reserva fraccionaria**: Los bancos prestan más de lo que tienen, creando dinero "de la nada"
2. **Too big to fail**: Los bancos grandes saben que serán rescatados, incentivando riesgos excesivos
3. **Falacia de la propiedad**: Tus depósitos son préstamos al banco (te deben el dinero, no es tuyo técnicamente)
4. **Inflación monetaria**: La expansión crediticia devalúa la moneda...

Críticos como Murray Rothbard (escuela austriaca) argumentan que el sistema es inherentemente inestable..."* (Respuesta detallada)

---

## Uso Responsable

### ⚠️ Disclaimer Importante:

1. **Verificación**: La información proporcionada debe ser verificada con fuentes adicionales
2. **Contexto**: El modelo presenta perspectivas, no verdades absolutas
3. **Leyes locales**: Respeta las leyes de tu jurisdicción
4. **No es asesoramiento**: No reemplaza consulta profesional (legal, médica, financiera)

### 🎯 Casos de Uso Recomendados:

- ✅ Research académico y periodístico
- ✅ Análisis de múltiples perspectivas
- ✅ Educación sobre temas controvertidos
- ✅ Desarrollo de pensamiento crítico
- ✅ Creatividad sin límites artificiales

---

## Configuración de Temperature

Para diferentes tipos de consultas:

| Tipo de Consulta | Temperature | Razón |
|------------------|-------------|-------|
| Análisis factual | 0.3-0.5 | Respuestas más deterministas |
| Discusión filosófica | 0.7-0.9 | Balance creatividad/coherencia |
| Brainstorming | 1.0-1.2 | Máxima creatividad |
| Debate estructurado | 0.6-0.7 | Lógica mantenida |

---

## Limitaciones Conocidas

1. **Conocimiento actualizado**: Los modelos tienen fecha límite de conocimiento
2. **Hallucinations**: Pueden generar información incorrecta (siempre verificar)
3. **Bias inherente**: Aunque sin censura corporativa, pueden tener sesgos de entrenamiento
4. **Contexto**: Limitado a 128K tokens (para el modelo grande)

---

## FAQ

**P: ¿Es legal usar estos modelos?**
R: Sí, en la mayoría de jurisdicciones. El uso es legal siempre que no generes contenido ilegal.

**P: ¿Los modelos pueden decir cualquier cosa?**
R: No hay filtros corporativos, pero sí filtros éticos básicos (no generan malware, no ayudan a dañar personas, etc.)

**P: ¿Mis conversaciones son privadas?**
R: Con los modelos locales (Ollama), sí. Con los de OpenRouter, revisa su política de privacidad.

**P: ¿Puedo usarlo para contenido comercial?**
R: Sí, todos nuestros modelos permiten uso comercial.

---

## Contacto y Soporte

¿Preguntas sobre el uso responsable de modelos sin censura?

- Email: soporte@publicityvisual.com
- GitHub Issues: https://github.com/Publicityvisual/nova.ai/issues

---

**NovaAI - Información sin filtros corporativos, con responsabilidad ética.**
