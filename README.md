# Oldy Fans Music Box - Frontend

Aplicación web frontend para el juego musical de trivias con sistema de puntuación, autenticación OAuth y Progressive Web App (PWA).

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [PWA Features](#pwa-features)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Rutas de la Aplicación](#rutas-de-la-aplicación)
- [Componentes Principales](#componentes-principales)
- [Contextos y Estado](#contextos-y-estado)
- [Flujo de Usuario](#flujo-de-usuario)
- [Test Cases](#test-cases)
- [Build y Deploy](#build-y-deploy)

## 🚀 Características

- **Progressive Web App (PWA)**: Instalable, funciona offline, cache inteligente
- **Autenticación múltiple**: Login manual y Google OAuth
- **Modo competitivo**: Juegos multijugador con scoreboard en vivo
- **Sistema QR**: Escaneo de códigos QR para acceder a cartas musicales
- **Responsive Design**: Optimizado para dispositivos móviles y desktop
- **Real-time Updates**: Scoreboard actualizado en tiempo real
- **Offline Support**: Páginas cached funcionan sin conexión
- **Modern UI**: Diseño glassmorphism con Tailwind CSS
- **TypeScript**: Type safety completo

## 🛠 Tecnologías

- **Next.js 16**: Framework React con App Router
- **React 19**: Biblioteca de interfaz de usuario
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de CSS utilitario
- **SWR**: Data fetching y cache
- **Workbox**: Service Workers y cache PWA
- **Radix UI**: Componentes accesibles
- **Framer Motion**: Animaciones
- **Lucide React**: Iconos

## 🛠 Instalación

```bash
# Clonar repositorio
git clone https://github.com/dexnou/frontend_oldly.git
cd frontend_oldly

# Instalar dependencias
npm install
# o con pnpm
pnpm install

# Generar iconos PWA
npm run generate-icons

# Desarrollo
npm run dev

# Build PWA completo
npm run build
```

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Configuración adicional
NEXT_PUBLIC_APP_NAME="Oldy Fans Fun Music Box"
NEXT_PUBLIC_APP_DESCRIPTION="Juego de música con cartas QR"
```

### Scripts Disponibles

```bash
npm run dev              # Desarrollo
npm run build           # Build completo con PWA
npm run build:pwa       # Solo generar Service Worker
npm run start          # Servidor de producción
npm run lint           # ESLint
npm run generate-icons # Generar iconos PWA
```

## 📱 PWA Features

### Service Worker
- **Precaching**: Archivos estáticos cached automáticamente
- **API Cache**: NetworkFirst para endpoints dinámicos
- **Image Cache**: CacheFirst para imágenes con expiración
- **Offline Fallback**: Página offline para navegación sin conexión

### Cache Strategies
```javascript
// API calls - NetworkFirst (10s timeout)
/api/* → Cache por 5 minutos

// Imágenes - CacheFirst 
*.{png,jpg,jpeg,svg} → Cache por 30 días

// Páginas - NetworkFirst
Navegación → Cache por 1 día

// Recursos estáticos - CacheFirst
/_next/static/* → Cache por 1 año
```

### Manifest Features
- **Installable**: Prompt automático de instalación
- **Standalone Mode**: Se abre sin barras del navegador
- **Iconos**: 8 tamaños diferentes (72px a 512px)
- **Theme Color**: Integrado con diseño
- **Orientación**: Portrait optimizado

### Installation Prompt
- Detecta automáticamente cuando la app es installable
- Prompt personalizado con diseño de la app
- Manejo de eventos `beforeinstallprompt` y `appinstalled`

## 📁 Estructura del Proyecto

```
frontend2/
├── app/                          # App Router (Next.js 16)
│   ├── layout.tsx               # Layout principal con PWA
│   ├── page.tsx                 # Página de inicio
│   ├── globals.css              # Estilos globales
│   │
│   ├── login/                   # Autenticación
│   │   └── page.tsx            # Página de login/registro
│   │
│   ├── play/[cardId]/          # Juego principal
│   │   └── page.tsx            # Interface de juego
│   │
│   ├── qr/[token]/             # Landing QR
│   │   └── page.tsx            # Redirección desde QR
│   │
│   ├── deck/[deckId]/          # Vista de mazo
│   │   └── page.tsx            # Información del mazo
│   │
│   ├── auth/callback/          # OAuth callback
│   │   └── page.tsx            # Procesamiento OAuth
│   │
│   ├── admin/                   # Panel administrativo
│   │   ├── layout.tsx          # Layout del admin
│   │   ├── login/page.tsx      # Login admin
│   │   ├── dashboard/page.tsx  # Dashboard
│   │   ├── users/page.tsx      # Gestión usuarios
│   │   ├── decks/page.tsx      # Gestión mazos
│   │   └── cards/page.tsx      # Gestión cartas
│   │
│   └── api/proxy/              # API Proxy
│       └── [...path]/route.ts  # Proxy a backend
│
├── src/
│   ├── components/              # Componentes reutilizables
│   │   ├── ServiceWorkerRegistration.tsx  # PWA SW
│   │   ├── PWAInstallPrompt.tsx          # Install prompt
│   │   ├── PurchaseModal.tsx             # Modal compras
│   │   └── ui/                           # UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...                       # 40+ componentes UI
│   │
│   ├── contexts/               # Context API
│   │   ├── AuthContext.tsx    # Autenticación de usuarios
│   │   └── AdminAuthContext.tsx # Autenticación admin
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── use-mobile.ts     # Detección mobile
│   │   └── use-toast.ts      # Sistema de notificaciones
│   │
│   ├── lib/                  # Utilidades
│   │   └── utils.ts         # Funciones helper
│   │
│   └── types/               # Tipos TypeScript
│       └── index.ts        # Tipos globales
│
├── public/                    # Archivos estáticos
│   ├── manifest.json         # Web App Manifest
│   ├── sw.js                # Service Worker
│   ├── offline.html         # Página offline
│   ├── icons/               # Iconos PWA (8 tamaños)
│   └── ...                  # Imágenes y assets
│
├── workbox-config.js         # Configuración PWA
├── next.config.mjs          # Configuración Next.js
├── tailwind.config.js       # Configuración Tailwind
├── tsconfig.json           # Configuración TypeScript
└── package.json           # Dependencias y scripts
```

## 🛣 Rutas de la Aplicación

### Públicas
```
/ → Página de inicio
/login → Login/Registro
/qr/[token] → Landing desde QR scan
/auth/callback → Callback OAuth Google
```

### Protegidas (requieren autenticación)
```
/play/[cardId] → Interface principal del juego
/deck/[deckId] → Información del mazo
```

### Admin (requiere autenticación de admin)
```
/admin/login → Login administrativo
/admin/dashboard → Dashboard con estadísticas
/admin/users → Gestión de usuarios
/admin/decks → Gestión de mazos
/admin/cards → Gestión de cartas
```

## 🧩 Componentes Principales

### Layout (`app/layout.tsx`)
```typescript
// Layout principal con PWA, auth y metadata
- Metadata PWA completa
- Service Worker registration
- Auth context provider
- PWA install prompt
- Analytics integration
```

### Login Page (`app/login/page.tsx`)
```typescript
// Autenticación dual
- Login manual (email/password)
- Google OAuth integration
- Registro de nuevos usuarios
- Validación de formularios
- Manejo de errores mejorado
```

### Game Interface (`app/play/[cardId]/page.tsx`)
```typescript
// Interface principal del juego
- Modo competitivo únicamente
- Scoreboard en vivo (sidebar)
- Sistema de puntuación
- Revelación de respuestas
- Auto-join de participantes
```

### QR Landing (`app/qr/[token]/page.tsx`)
```typescript
// Procesamiento de QR codes
- Validación de tokens QR
- Redirección inteligente
- Manejo de errores de token
```

## 🎯 Contextos y Estado

### AuthContext (`src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

// Funcionalidades:
- Verificación automática de token
- Persistencia en localStorage y cookies
- Auto-logout en token inválido
- Manejo gracioso de errores de backend
```

### AdminAuthContext (`src/contexts/AdminAuthContext.tsx`)
```typescript
interface AdminAuthContextType {
  admin: AdminUser | null
  isLoggedIn: boolean
  token: string | null
  login: (token: string, admin: AdminUser) => void
  logout: () => void
  loading: boolean
}

// Gestión separada para administradores
```

## 👤 Flujo de Usuario

### 1. Primera Visita
```
1. Usuario escanea QR → /qr/[token]
2. Sistema valida token → GET /api/cards/:token
3. Si válido → redirect a /play/[cardId]
4. Si no autenticado → redirect a /login?redirect=/play/[cardId]
5. Usuario se registra/loguea
6. Redirect automático al juego
```

### 2. Juego Competitivo
```
1. Acceso a carta → /play/[cardId]
2. Sistema busca juego activo → GET /api/game/active-competitive/:deckId
3. Si no existe → crear nuevo juego → POST /api/game/start-competitive
4. Auto-join como participante
5. Mostrar interfaz con scoreboard en vivo
6. Por cada respuesta → POST /api/game/:gameId/submit-competitive-round
7. Actualizar scoreboard en tiempo real
```

### 3. Sistema PWA
```
1. Primera carga → Service Worker se registra
2. Recursos se cachean automáticamente
3. Prompt de instalación aparece (si es installable)
4. Usuario puede instalar desde prompt o navegador
5. App funciona offline con páginas cached
```

## 🧪 Test Cases

### Funcionalidad Core

#### Autenticación
```bash
# Manual Login
- ✅ Registro exitoso con validación
- ✅ Login con credenciales correctas  
- ❌ Login con credenciales incorrectas
- ✅ Persistencia de sesión (refresh)
- ✅ Logout correcto

# Google OAuth
- ✅ Redirección a Google
- ✅ Callback processing
- ✅ Auto-login post OAuth
```

#### Juego
```bash
# QR Flow
- ✅ QR token válido → acceso a carta
- ❌ QR token inválido → error handling
- ✅ Redirección con auth requerido

# Competitive Mode
- ✅ Inicio de nuevo juego
- ✅ Join automático de participante
- ✅ Envío de rondas
- ✅ Update de scoreboard
- ✅ Expiración de juego (1 hora)
```

#### PWA
```bash
# Installation
- ✅ Service Worker registration
- ✅ Install prompt display
- ✅ Successful app installation
- ✅ Standalone mode launch

# Offline
- ✅ Cached pages work offline
- ✅ Images display from cache
- ✅ Offline page shows for uncached routes
- ✅ Online detection and auto-refresh
```

### Testing con Navegador

#### Chrome DevTools
```bash
# Application > Service Workers
- Verificar SW activo y running
- Check update on reload

# Application > Storage > Cache
- Verificar múltiples caches creados:
  * workbox-precache-v2-*
  * api-cache
  * images-cache  
  * pages-cache

# Application > Manifest
- Verificar manifest.json válido
- Test install button
```

#### Lighthouse PWA Audit
```bash
# Debe pasar todos los criterios PWA:
- ✅ Fast and reliable (Service Worker)
- ✅ Installable (Manifest + Install prompt)  
- ✅ PWA Optimized (Icons, theme, viewport)

# Scores esperados:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100
- PWA: 100
```

### Postman/API Testing

#### Proxy Endpoints
```bash
# Auth
POST /api/proxy/auth/register
POST /api/proxy/auth/login
GET /api/proxy/auth/me

# Cards
GET /api/proxy/cards/:token

# Game  
GET /api/proxy/game/active-competitive/:deckId
POST /api/proxy/game/start-competitive
POST /api/proxy/game/:gameId/submit-competitive-round

# Decks
GET /api/proxy/decks
POST /api/proxy/decks/:deckId/activate

# Rankings
GET /api/proxy/rankings/:deckId
```

## 🚀 Build y Deploy

### Development
```bash
npm run dev
# Disponible en http://localhost:3001
```

### Production Build
```bash
# Build completo con PWA
npm run build

# Esto ejecuta:
# 1. next build (compilar app)
# 2. workbox generateSW (generar service worker)

# Iniciar producción
npm start
```

### PWA Verification
```bash
# Después del build, verificar:
ls public/sw.js          # Service Worker generado
ls public/manifest.json  # Web App Manifest
ls public/icons/         # Iconos PWA (8 archivos)
ls public/offline.html   # Página offline
```

### Deploy Checklist
```bash
# Pre-deploy
- ✅ Build exitoso sin errores
- ✅ Service Worker generado
- ✅ Variables de entorno configuradas
- ✅ Backend URL actualizada para producción

# Post-deploy
- ✅ PWA installable en producción
- ✅ HTTPS habilitado (requerido para PWA)
- ✅ Service Worker funciona
- ✅ Cache strategies activas
- ✅ Offline functionality
```

### Vercel Deploy
```bash
# Configurar variables de entorno en Vercel:
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.com

# Build automático con PWA:
# vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/sw.js",
      "headers": {
        "cache-control": "public, max-age=0, must-revalidate"
      }
    }
  ]
}
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuraciones

### Next.js Config (`next.config.mjs`)
```javascript
// Configuración optimizada para PWA
- Headers para manifest y SW
- Cache headers optimizados
- Image optimization
- TypeScript ignore para build rápido
```

### Tailwind Config (`tailwind.config.js`)
```javascript
// Theme personalizado con:
- Componentes UI customizados
- Animaciones glassmorphism
- Responsive breakpoints
- Dark mode support
```

### Workbox Config (`workbox-config.js`)
```javascript
// Cache strategies optimizadas:
- Runtime caching para APIs
- Precaching de assets estáticos
- Network-first para navegación
- Cache-first para imágenes
```

## 🐛 Troubleshooting

### Errores Comunes

#### Service Worker No Se Registra
```bash
# Verificar:
1. HTTPS en producción (requerido)
2. Archivo sw.js accesible
3. No hay errores en console
4. Scope correcto del SW
```

#### PWA No Es Installable  
```bash
# Verificar:
1. manifest.json válido
2. Iconos de 192x192 y 512x512 disponibles
3. Service Worker registrado
4. HTTPS (producción)
5. Meets PWA criteria en Lighthouse
```

#### Auth Context Errors
```bash
# Verificar:
1. Backend corriendo en puerto correcto
2. CORS configurado correctamente
3. JWT_SECRET configurado en backend
4. Variables de entorno del frontend
```

### Performance Optimization

```bash
# Optimizaciones implementadas:
- Image optimization con Next.js
- Code splitting automático
- Service Worker precaching
- API response caching con SWR
- Lazy loading de componentes
- Bundle analysis disponible
```

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte y preguntas:
- **Email**: soporte@oldlymusic.com
- **GitHub Issues**: [Crear issue](https://github.com/dexnou/frontend_oldly/issues)
- **Documentation**: Ver [PWA-README.md](PWA-README.md) para documentación específica de PWA

---

**Oldy Fans Fun Music Box Frontend** - Progressive Web App desarrollada con ❤️ por el equipo de dexnou