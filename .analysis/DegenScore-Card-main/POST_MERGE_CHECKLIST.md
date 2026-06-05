# ✅ Post-Merge Checklist - PR #19

## Verificación de Deploy

### Render Dashboard

- [ ] Build successful
- [ ] Deploy live
- [ ] No errors en logs

### Verificación del Sitio

- [ ] Abrir URL de Render (ej: https://degenscore-card.onrender.com)
- [ ] Sitio carga sin errores
- [ ] No hay errores en consola del navegador (F12)
- [ ] Wallet connection funciona
- [ ] Leaderboard carga datos
- [ ] Database queries funcionan (verifica que usa nueva password)

### Verificación de Variables de Entorno

- [ ] DATABASE_URL actualizada con nueva password
- [ ] HELIUS_API_KEY actualizada
- [ ] Todas las 11 variables presentes en Render

## Setup Local Post-Merge

### Actualizar Branch Local

```bash
# Cambiar a main
git checkout main

# Pull latest changes
git pull origin main

# Verificar que tienes el último commit
git log --oneline -1
# Debería mostrar: 686e130 Merge pull request #19
```

### Instalar Dependencias

```bash
# Limpiar instalación anterior
rm -rf node_modules package-lock.json

# Instalar con .npmrc (usa legacy-peer-deps)
npm install

# Debería completar SIN errores
```

### Inicializar Herramientas

```bash
# Inicializar Husky hooks
npm run prepare

# Formatear código
npm run format

# Verificar que todo funciona
npm run validate
```

### Probar Localmente

```bash
# Iniciar dev server
npm run dev

# Abrir http://localhost:3000
# Verificar que funciona
```

## Limpieza

### Eliminar Branch Mergeado

```bash
# Local
git branch -d claude/deploy-fixes-and-phase1-01LDDxju753GTZd6nAVpUvVJ

# Remote (GitHub lo hace automáticamente)
```

### Archivar Documentos de Security

```bash
# Ya no necesitas estos archivos en producción:
# - SECURITY_NOTICE.md (puedes eliminarlo o moverlo a docs/)
# - RENDER_DEPLOYMENT_UPDATE.md (ya está hecho)
# - PR_DESCRIPTION.md (ya está en GitHub)

# Opcional: moverlos a carpeta de documentación
mkdir -p docs/archive
mv SECURITY_NOTICE.md RENDER_DEPLOYMENT_UPDATE.md PR_DESCRIPTION.md docs/archive/
git add -A
git commit -m "chore: archive security remediation docs"
git push origin main
```

## Próximos Pasos

### Esta Semana: Phase 1 Week 1

- [ ] Leer PHASE1_WEEK1_QUICKSTART.md
- [ ] Instalar librerías de animación (lottie-react, @react-spring/web)
- [ ] Probar componentes de animación en /test-animations
- [ ] Mejorar DegenCard con animaciones
- [ ] Mejorar Leaderboard con stagger animations

### Este Mes: Completar Phase 1

- [ ] Semana 1: Animaciones básicas ✅ (foundation hecha)
- [ ] Semana 2: Sistema de achievements
- [ ] Semana 3: Social features + live feed
- [ ] Semana 4: Polish + performance

### Meta: ChatGPT Score

- Actual: 9.0/10
- Meta Semana 1: 9.3/10
- Meta Mes 1: 9.5/10
- Meta Final: 10/10

## Troubleshooting

### Si Render sigue fallando:

1. Verificar que Build Command tiene --legacy-peer-deps
2. Verificar que todas las variables de entorno están configuradas
3. Revisar logs de Render para error específico

### Si local no funciona:

1. Borrar node_modules y package-lock.json
2. npm install (debería usar .npmrc automáticamente)
3. Si sigue fallando, usar: npm install --legacy-peer-deps manualmente

### Si hay problemas de credenciales:

1. Verificar que rotaste las passwords en Supabase/Helius
2. Verificar que actualizaste en Render
3. Verificar que .env.local local tiene las nuevas credenciales
4. Redeploy en Render

---

**Completado**: 2025-11-16
**PR Mergeado**: #19 (686e130)
**Próximo Milestone**: Phase 1 Week 1 completado
