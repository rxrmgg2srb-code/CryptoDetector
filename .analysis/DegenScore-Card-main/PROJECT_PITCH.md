# 🚀 DegenScore - La Plataforma Definitiva de Identidad y Analítica Web3

**Documentación del Proyecto y Pitch Deck**

---

## 1. Resumen Ejecutivo

**DegenScore** es una plataforma de análisis gamificada de primer nivel construida para el ecosistema Solana. Transforma los datos crudos de la blockchain en una "Identidad Degen" unificada y atractiva. Al analizar el historial de trading, la rentabilidad y el comportamiento de riesgo, DegenScore asigna a cada wallet una puntuación única (0-100) y crea una "Degen Card" compartible.

No es solo una herramienta de análisis; es una **capa de reputación social** para traders de Web3, combinando insights profundos de datos con gamificación competitiva.

---

## 2. El Problema

- **Identidad Fragmentada:** Los traders no tienen una forma única de demostrar su historial o nivel de habilidad en el ecosistema Solana.
- **Sobrecarga de Datos:** Los datos crudos de la blockchain son difíciles de interpretar para el usuario promedio.
- **Riesgos de Seguridad:** Se lanzan nuevos tokens cada segundo, y los traders carecen de herramientas de seguridad rápidas y fiables para evaluar riesgos (rug pulls, honeypots).
- **Falta de Engagement:** La mayoría de las herramientas de análisis son secas, aburridas y puramente funcionales, careciendo del factor "diversión" de la cultura cripto.

## 3. La Solución: DegenScore Card

DegenScore resuelve estos problemas empaquetando datos complejos en un producto simple, hermoso y altamente compartible.

- **Puntuación Unificada:** Un número único (0-100) que representa la habilidad y experiencia de un trader.
- **Gamificación:** Leaderboards, insignias, niveles y logros que impulsan la retención de usuarios.
- **Seguridad Primero:** Herramientas integradas de Token Scanner y Super Token Scorer para mantener seguros a los usuarios.
- **Prueba Social:** "Degen Cards" compartibles que sirven como currículum para traders de cripto.

---

## 4. Características Clave

### 🏆 El Leaderboard (Tabla de Clasificación)

Un sistema de clasificación competitivo en tiempo real donde los usuarios compiten por el primer puesto.

- **Ranking Dinámico:** Basado en DegenScore, Volumen y P&L (Ganancias y Pérdidas).
- **Niveles y Medallas:** Distinción visual para los mejores traders (Oro, Plata, Bronce).
- **Funciones Sociales:** Sistema de Likes, seguimiento de referidos y exploración de perfiles.
- **Rendimiento:** Optimizado con renderizado del lado del cliente para una carga instantánea.

### 🛡️ Token Scanner

Una potente herramienta de seguridad integrada directamente en la plataforma.

- **Integración con RugCheck:** Análisis en tiempo real de contratos de tokens.
- **Puntuación de Riesgo:** Veredicto instantáneo de "Seguro" o "Peligro".
- **Métricas Detalladas:** Análisis de liquidez, distribución de holders y comprobaciones de autoridad.

### 🧠 Super Token Scorer

Una herramienta de análisis avanzada impulsada por IA para una investigación profunda de tokens.

- **Análisis Multifactorial:** Combina más de 15 puntos de datos (sentimiento social, volumen, liquidez, etc.).
- **Insights de IA:** Genera resúmenes y recomendaciones legibles por humanos.
- **Puntuación Visual:** Una puntuación de 0-1000 para tokens, similar al DegenScore del usuario.

### ⚔️ Modo Comparar

Un modo de batalla "Cara a Cara" para wallets.

- **Comparación Directa:** Compara dos wallets una al lado de la otra.
- **Gráficos Visuales:** Gráficos de comparación de tasa de victorias, volumen y P&L.
- **Declaración de Ganador:** Declara automáticamente un "Ganador" basado en estadísticas agregadas.

### 👥 Sistema de Seguimiento (Following)

Una capa social que permite a los usuarios seguir a sus traders favoritos.

- **Lista de Seguimiento:** Mantén vigilado el "Smart Money" o a tus amigos.
- **Feed de Actividad:** (Roadmap) Ver cuándo las wallets seguidas hacen movimientos.

---

## 5. Arquitectura Técnica

Construido con un stack moderno, escalable y de alto rendimiento diseñado para velocidad y fiabilidad.

### **Frontend**

- **Framework:** Next.js 14 (React 18) - Serverless y Generación Estática.
- **Estilos:** TailwindCSS + Framer Motion (Animaciones Premium).
- **Gestión de Estado:** Zustand (Ligero y rápido).
- **Visualización:** Chart.js y Recharts.

### **Backend y Datos**

- **Base de Datos:** PostgreSQL (Supabase) - Datos relacionales escalables.
- **ORM:** Prisma - Acceso a base de datos con tipado seguro.
- **Caché:** Redis (Upstash) - Caché de alto rendimiento para leaderboards.
- **Colas:** BullMQ - Procesamiento de trabajos asíncronos.

### **Integración Blockchain**

- **Solana:** Integración profunda con `@solana/web3.js`.
- **RPC:** Helius (Nodos RPC de alto rendimiento).
- **Wallets:** Soporte para Phantom, Solflare, Backpack vía Wallet Adapter.

### **IA e Inteligencia**

- **OpenAI:** Integración para generar insights en lenguaje natural y "Roasts".

---

## 6. Modelo de Negocio y Monetización

DegenScore está arquitecturado para la sostenibilidad y la generación de ingresos.

1.  **Modelo Freemium:** La puntuación básica y el acceso al leaderboard son gratuitos.
2.  **Suscripciones Premium (Pro):**
    - Acceso al **Super Token Scorer**.
    - **Escaneos de Tokens** ilimitados.
    - Experiencia **sin anuncios**.
    - **Insignias Exclusivas** (ej. "Whale", "Early Adopter").
3.  **Sistema de Referidos:** Mecanismo de crecimiento viral que recompensa a los usuarios por traer nuevos traders.

---

## 7. Roadmap Futuro

- **AI Trading Coach:** Asesoramiento personalizado basado en el historial de trading.
- **App Móvil:** Experiencia nativa en iOS/Android.
- **Soporte Multi-Chain:** Expansión a Base, Ethereum y Arbitrum.
- **Copy Trading:** Copy trading en un clic de las mejores wallets del leaderboard.

---

**Listo para Desplegar.**
DegenScore es una plataforma completamente funcional y lista para producción, con una UI pulida, un backend robusto y una propuesta de valor clara en el auge del ecosistema Solana.
