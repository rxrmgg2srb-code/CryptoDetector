# 🌍 Sistema de Internacionalización (i18n)

## ✅ ¡Ya está Implementado!

Tu proyecto ahora soporta **3 idiomas**:

- 🇪🇸 **Español** (por defecto)
- 🇬🇧 **Inglés**
- 🇨🇳 **Chino**

---

## 📁 Estructura de Archivos

```
DegenScore-Card/
├── lib/
│   └── i18n.ts                     # Configuración de i18n
├── locales/
│   ├── es/
│   │   └── common.json             # Traducciones español
│   ├── en/
│   │   └── common.json             # Traducciones inglés
│   └── zh/
│       └── common.json             # Traducciones chino
├── components/
│   ├── LanguageSelector.tsx        # Selector de idioma (dropdown)
│   └── Header.tsx                  # Ejemplo de header con selector
└── pages/
    └── _app.tsx                    # Provider configurado
```

---

## 🚀 Cómo Usar en tus Componentes

### 1. Importa el hook `useTranslation`

```tsx
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta')}</button>
    </div>
  );
};
```

### 2. Traducciones con variables

```tsx
// En common.json:
{
  "scarcity": {
    "title": "Solo {{spots}} Slots Premium Restantes"
  }
}

// En tu componente:
<p>{t('scarcity.title', { spots: 50 })}</p>
// Resultado: "Solo 50 Slots Premium Restantes"
```

### 3. Traducciones plurales

```tsx
// En common.json:
{
  "activity": {
    "referral": "refirió {{count}} nuevo degen"
  }
}

// En tu componente:
<p>{t('activity.referral', { count: 3 })}</p>
// Resultado: "refirió 3 nuevo degen"
```

---

## 🎨 Añadir el Selector de Idioma

### Opción 1: Usar el Header completo

```tsx
import { Header } from '@/components/Header';

export default function Page() {
  return (
    <>
      <Header /> {/* Ya incluye LanguageSelector */}
      {/* Tu contenido */}
    </>
  );
}
```

### Opción 2: Añadir solo el selector

```tsx
import { LanguageSelector } from '@/components/LanguageSelector';

export default function Page() {
  return (
    <div>
      <nav>
        {/* Tus links de navegación */}
        <LanguageSelector /> {/* Selector de idioma */}
      </nav>
    </div>
  );
}
```

### Opción 3: Versión simple (sin Framer Motion)

```tsx
import { LanguageSelectorSimple } from '@/components/LanguageSelector';

// Usa LanguageSelectorSimple en lugar de LanguageSelector
<LanguageSelectorSimple />;
```

---

## 📝 Añadir Nuevas Traducciones

### 1. Edita los archivos JSON

**locales/es/common.json**:

```json
{
  "mi_nueva_seccion": {
    "titulo": "Mi Título",
    "descripcion": "Mi descripción en español"
  }
}
```

**locales/en/common.json**:

```json
{
  "mi_nueva_seccion": {
    "titulo": "My Title",
    "descripcion": "My description in English"
  }
}
```

**locales/zh/common.json**:

```json
{
  "mi_nueva_seccion": {
    "titulo": "我的标题",
    "descripcion": "我的英文描述"
  }
}
```

### 2. Usa las traducciones

```tsx
const { t } = useTranslation();

<h1>{t('mi_nueva_seccion.titulo')}</h1>
<p>{t('mi_nueva_seccion.descripcion')}</p>
```

---

## 🌐 Añadir Más Idiomas

### 1. Crea el archivo de traducción

```bash
mkdir -p locales/fr
touch locales/fr/common.json
```

### 2. Añade las traducciones

**locales/fr/common.json**:

```json
{
  "nav": {
    "home": "Accueil",
    "leaderboard": "Classement",
    "documentation": "Documentation"
  }
}
```

### 3. Actualiza `lib/i18n.ts`

```typescript
import translationFR from '../locales/fr/common.json';

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN },
  zh: { translation: translationZH },
  fr: { translation: translationFR }, // ← Añade esto
};
```

### 4. Actualiza `LanguageSelector.tsx`

```typescript
const languages: Language[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' }, // ← Añade esto
];
```

---

## 🎯 Ejemplos de Uso Comunes

### Botones

```tsx
<button>{t('common.save')}</button>
<button>{t('common.cancel')}</button>
<button>{t('common.confirm')}</button>
```

### Mensajes de error

```tsx
{
  error && <p className="text-red-500">{t('errors.server_error')}</p>;
}
```

### Estados de carga

```tsx
{
  loading ? t('common.loading') : t('common.view_more');
}
```

### Cards y métricas

```tsx
<div>
  <h3>{t('card.degen_score')}</h3>
  <p>{score}</p>
</div>

<div>
  <h3>{t('card.win_rate')}</h3>
  <p>{winRate}%</p>
</div>
```

---

## 🔄 Cambiar Idioma Programáticamente

```tsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();

// Cambiar a inglés
i18n.changeLanguage('en');

// Cambiar a chino
i18n.changeLanguage('zh');

// Obtener idioma actual
const currentLang = i18n.language; // 'es', 'en', o 'zh'
```

---

## 💾 Persistencia Automática

El idioma se guarda automáticamente en `localStorage` gracias a `i18next-browser-languagedetector`.

Cuando el usuario vuelve, el idioma que eligió se carga automáticamente.

---

## 🎨 Personalizar el Selector de Idioma

### Cambiar colores

En `LanguageSelector.tsx`:

```tsx
// Cambiar color del botón
className = 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30';
// Por ejemplo a azul:
className = 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30';

// Cambiar color del dropdown
className = 'bg-gray-900 border border-purple-500/30';
// Por ejemplo:
className = 'bg-black border border-blue-500/30';
```

### Cambiar posición

```tsx
// Dropdown alineado a la derecha (default)
className = 'absolute right-0 mt-2';

// Dropdown alineado a la izquierda
className = 'absolute left-0 mt-2';
```

### Solo mostrar bandera (sin texto)

```tsx
<span className="text-2xl">{currentLanguage.flag}</span>;
{
  /* Elimina esta línea: */
}
<span className="hidden sm:inline text-sm font-medium text-white">
  {currentLanguage.nativeName}
</span>;
```

---

## 🧪 Testing

### Probar cambio de idioma

1. Inicia el servidor: `npm run dev`
2. Abre: `http://localhost:3000`
3. Haz clic en el selector de idioma (arriba derecha)
4. Selecciona un idioma diferente
5. Todo el texto debería cambiar instantáneamente

### Verificar persistencia

1. Cambia el idioma a Inglés
2. Recarga la página (F5)
3. El idioma debería seguir siendo Inglés

### Verificar traducción faltante

Si una traducción no existe, verás la key en lugar del texto:

```
nav.home  ← Esto significa que falta la traducción
```

Añádela al archivo `common.json` correspondiente.

---

## 📊 Traducciones Disponibles

### Actualmente traducidas:

✅ **Navegación** (nav)

- Home, Leaderboard, Documentation
- Conectar/Desconectar wallet

✅ **Hero Section** (hero)

- Título, subtítulo, CTA
- Estadísticas

✅ **Card Métricas** (card)

- 12 métricas principales
- Badges, niveles

✅ **Tiers** (tiers)

- FREE, PREMIUM, PRO
- Todas las features

✅ **Check-In** (checkin)

- Título, racha, botón
- Milestones, XP

✅ **Referidos** (referrals)

- Sistema completo
- 4 tiers de rewards

✅ **Challenges** (challenges)

- Título, premio, participar

✅ **Leaderboard** (leaderboard)

- Filtros, categorías

✅ **Live Activity** (activity)

- 6 tipos de acciones

✅ **Scarcity Banner** (scarcity)

- Mensajes de urgencia

✅ **Documentación** (documentation)

- 13 secciones

✅ **Común** (common)

- Loading, errores, botones

✅ **Errores** (errors)

- Mensajes de error

---

## 🚨 Solución de Problemas

### Error: "i18n is not defined"

**Solución**: Asegúrate de que `lib/i18n.ts` esté importado en `_app.tsx`:

```tsx
import i18n from '../lib/i18n';
```

### Error: "useTranslation hook not working"

**Solución**: Verifica que `I18nextProvider` esté envolviendo tu app en `_app.tsx`:

```tsx
<I18nextProvider i18n={i18n}>{/* Tu app */}</I18nextProvider>
```

### Traducciones no se cargan

**Solución**: Verifica que los archivos JSON estén en la ubicación correcta:

```
locales/es/common.json
locales/en/common.json
locales/zh/common.json
```

### Idioma no persiste después de reload

**Solución**: Asegúrate de que `i18next-browser-languagedetector` esté instalado:

```bash
npm install i18next-browser-languagedetector
```

---

## 📚 Recursos

- **react-i18next docs**: https://react.i18next.com/
- **i18next docs**: https://www.i18next.com/
- **Traducciones automáticas**: https://www.deepl.com/ (mejor que Google Translate)

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias (react-i18next, i18next)
- [x] Crear archivos de traducción (ES, EN, ZH)
- [x] Configurar i18n (`lib/i18n.ts`)
- [x] Crear LanguageSelector component
- [x] Añadir I18nextProvider en `_app.tsx`
- [x] Crear Header con selector integrado
- [ ] Añadir el Header a tu página principal
- [ ] Convertir textos hardcodeados a usar `t()`
- [ ] Probar cambio de idiomas
- [ ] Probar persistencia en localStorage

---

## 🎊 ¡Listo!

Tu app ahora soporta **3 idiomas** completos con un selector bonito en la parte superior.

### Próximos pasos sugeridos:

1. **Añadir el Header a tu página principal**:

   ```tsx
   import { Header } from '@/components/Header';

   export default function Home() {
     return (
       <>
         <Header />
         {/* Tu contenido */}
       </>
     );
   }
   ```

2. **Convertir textos existentes**:
   - Busca textos hardcodeados como "Connect Wallet"
   - Reemplázalos por `{t('nav.connect_wallet')}`

3. **Añadir más traducciones**:
   - Traduce componentes específicos de tu app
   - Badges, challenges, modal de upgrade, etc.

4. **Mejorar UX**:
   - Añade animaciones al cambiar idioma
   - Muestra banderas en el navbar mobile
   - Añade tooltips explicativos

---

**¿Dudas?** Revisa la documentación oficial de react-i18next o pregunta.
