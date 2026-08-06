# FEATURE SPEC: Agente 1 (News Scraper & Content Ideation)

## 1. Descripción General
Agente autónomo encargado de escanear la web diariamente en busca de noticias relevantes del sector del negocio, filtrarlas y generar 10 ideas de contenido multiplataforma listas para revisión humana.

## 2. Triggers (Disparadores)
- **Automático:** Cron Job ejecutado vía Firebase Cloud Scheduler todos los días a las 09:00 AM (Hora Argentina).
- **Manual:** Botón "Forzar Escaneo" desde el Dashboard (UI).

## 3. Inputs (Entradas)
- Herramienta de Búsqueda Web (Brave Search MCP / Tavily).
- Variables de Configuración (guardadas en Firestore `settings`):
  - `industry_keywords`: (Ej. "tecnología, marketing, startups")
  - `negative_keywords`: (Ej. "política, sucesos, deportes")
  - `target_audience_profile`: Perfil del cliente ideal.

## 4. Flujo de Ejecución (Pipeline)
1. **Extracción:** Usa la herramienta de búsqueda para obtener las 15 noticias más relevantes de las últimas 24 horas usando las `industry_keywords`.
2. **Filtrado:** Descarta las noticias que contengan `negative_keywords` o que no aporten valor al `target_audience_profile`.
3. **Ideación (LLM - Gemini 1.5 Flash/Pro):** 
   - Toma las noticias filtradas.
   - Genera exactamente 10 ideas de contenido.
   - Formato requerido: Adaptación para Instagram (Reel/Carrusel), YouTube (Short/Largo) y TikTok.
4. **Almacenamiento:** Guarda los resultados en la base de datos.

## 5. Outputs (Salidas)
Colección en Firestore: `news_ideas`
Documento de salida (Esquema Zod / TypeScript Interface):
- `id`: string (UUID)
- `sourceUrl`: string
- `headline`: string
- `contentIdea`: string (markdown)
- `platforms`: array of strings
- `status`: string (Default: 'pending_review')
- `createdAt`: timestamp

## 6. Restricciones y Reglas de Seguridad (CERO Alucinaciones)
- El agente tiene estrictamente prohibido inventar noticias. Si un día no hay noticias relevantes, debe generar un reporte indicando "No hay noticias relevantes hoy" y generar 0 ideas.
- Toda idea debe estar atada a una URL fuente real y verificable.
