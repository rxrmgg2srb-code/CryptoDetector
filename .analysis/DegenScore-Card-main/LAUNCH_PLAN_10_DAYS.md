# 🚀 Plan de Lanzamiento: 10 Días para el Despegue

**Objetivo:** Lanzar DegenScore en Producción (Mainnet) en 10 días.

---

## 📅 Fase 1: Pulido Técnico (Días 1-3)

_El objetivo es asegurar que nada se rompa cuando entren los usuarios._

- **Día 1: Stress Test de Base de Datos**
  - [ ] Verificar que el `Transaction Pooler` (puerto 6543) aguanta 100 conexiones simultáneas.
  - [ ] Revisar índices de base de datos para que el Leaderboard cargue en <200ms.
- **Día 2: Auditoría de Seguridad Final**
  - [ ] Verificar que las API Keys (Helius, OpenAI) no estén expuestas en el cliente.
  - [ ] Probar límites de Rate Limiting (evitar que un bot te gaste la cuota de RPC).
- **Día 3: Optimización Móvil**
  - [ ] Asegurar que las "Degen Cards" se ven perfectas en iPhone/Android (es donde la gente compartirá).
  - [ ] Arreglar cualquier desbordamiento de texto en pantallas pequeñas.

## 📣 Fase 2: Preparación de Marketing (Días 4-6)

_No lances en silencio. Genera ruido antes._

- **Día 4: Configuración de Analíticas**
  - [ ] Instalar Google Analytics o PostHog para medir usuarios.
  - [ ] Configurar alertas de error (Sentry) para saber si algo falla en tiempo real.
- **Día 5: Creación de Contenido Viral**
  - [ ] Grabar 3 videos cortos (15-30s): "Cómo ver tu Degen Score", "Detectando un Rug Pull", "God Mode vs Exit Liquidity".
  - [ ] Preparar hilos de Twitter explicando el proyecto.
- **Día 6: "Teaser" en Twitter**
  - [ ] Publicar una captura misteriosa o un video corto. "Algo grande llega a Solana... 4 días."
  - [ ] Empezar a seguir a influencers y cuentas clave.

## 🚀 Fase 3: Soft Launch & Go Live (Días 7-10)

_Lanzamiento controlado para asegurar el éxito._

- **Día 7: Soft Launch (Beta Cerrada)**
  - [ ] Pasar el link a 10-20 amigos o un grupo de Telegram de confianza.
  - [ ] Pedir feedback brutal. ¿Algo no se entiende? ¿Algo falla?
- **Día 8: Día de Correcciones (Bug Fix Day)**
  - [ ] Arreglar todo lo que reportaron los beta testers.
  - [ ] **CONGELAR CÓDIGO:** No más cambios nuevos, solo arreglos.
- **Día 9: Preparación Final**
  - [ ] Limpiar la base de datos (borrar datos de prueba).
  - [ ] Verificar saldo en Helius/OpenAI para no quedarnos sin servicio.
- **Día 10: 🟢 PUBLIC LAUNCH**
  - [ ] Publicar el Hilo de Lanzamiento en Twitter.
  - [ ] Enviar DMs a influencers con su propia "Degen Card" generada (¡Les encantará verse!).
  - [ ] Monitorizar servidores y celebrar.

---

## ✅ Checklist Crítico Pre-Lanzamiento

- [ ] **Dominio:** ¿Tienes un dominio `.com` o `.sol` apuntando a Vercel?
- [ ] **SEO:** ¿Tienen las páginas títulos y descripciones atractivas para Google/Twitter Cards?
- [ ] **Costes:** ¿Tienes tarjeta de crédito configurada en Vercel/Supabase/Helius por si superas el tier gratuito?
- [ ] **Legal:** (Opcional pero recomendado) Términos de Servicio básicos y Política de Privacidad.

---

_Este plan está diseñado para maximizar el impacto y minimizar el riesgo técnico._
