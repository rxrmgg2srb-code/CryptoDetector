# 🎟️ Sistema de Códigos Promocionales

## Códigos Activos

### DEGENLAUNCH2024

- **Descripción**: Promoción de lanzamiento - Acceso Premium Gratuito
- **Beneficios**: Upgrade premium GRATIS (equivalente a 0.1 SOL)
- **Límite de usos**: 100 usuarios
- **Expiración**: Sin límite de tiempo
- **Estado**: ✅ ACTIVO

## Cómo usar un código promocional

1. Genera tu Degen Card ingresando tu wallet address
2. En el modal de upgrade, verás una sección "Have a Promo Code?"
3. Ingresa el código: `DEGENLAUNCH2024`
4. Haz click en "Apply"
5. ¡Tu card será automáticamente upgradeada a premium! 🎉

## Beneficios Premium

Con un código promocional obtienes GRATIS:

- ✅ Foto de perfil personalizada
- ✅ Enlaces a redes sociales (Twitter & Telegram)
- 🏆 Acceso al leaderboard
- ⬇️ Descarga de card premium en alta resolución
- 💎 Diseño premium con efectos especiales

## Para Administradores

### Crear el código promocional inicial

Después de aplicar las migraciones de base de datos, ejecuta:

```bash
npx ts-node scripts/create-promo-code.ts
```

### Crear códigos adicionales

Usa el mismo script modificando los parámetros, o usa Prisma Studio:

```bash
npx prisma studio
```

Luego ve a la tabla `PromoCode` y crea un nuevo registro con:

- `code`: El código (en mayúsculas, sin espacios)
- `description`: Descripción del código
- `maxUses`: Número máximo de usos (0 = ilimitado)
- `isActive`: true
- `expiresAt`: Fecha de expiración (opcional)

### Verificar uso de códigos

```bash
npx prisma studio
```

Ve a la tabla `PromoRedemption` para ver quién ha usado cada código.

## Características Técnicas

- ✅ Transacciones atómicas (previene condiciones de carrera)
- ✅ Un usuario solo puede usar cada código una vez
- ✅ Validación de límites y expiraciones
- ✅ Rate limiting para prevenir abuso
- ✅ Logging completo de redenciones

## Seguridad

- Los códigos son case-insensitive (se normalizan a mayúsculas)
- Validación en backend para prevenir bypass
- Sistema de rate limiting protege contra spam
- Transacciones de base de datos garantizan consistencia
- No se pueden reutilizar códigos por el mismo usuario
