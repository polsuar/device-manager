# Device Manager

Aplicación web para gestionar dispositivos IoT, desarrollada con React, TypeScript y Material UI.

## Características

- Dashboard con estadísticas en tiempo real
- Gestión de dispositivos (agregar, editar, eliminar)
- Monitoreo de frecuencia cardíaca
- Seguimiento de ubicación
- Monitoreo de batería
- Sistema de notificaciones
- Autenticación de usuarios

## Tecnologías

- React
- TypeScript
- Material UI
- Firebase
- Vite
- React Router
- Recharts
- Leaflet

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Cuenta de Firebase

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/ec-lab.git
cd ec-lab/device-manager
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo de variables de entorno:

```bash
cp .env.example .env
```

4. Configurar las variables de entorno en el archivo `.env` con tus credenciales de Firebase.

5. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

## Despliegue

1. Construir la aplicación:

```bash
npm run build
```

2. Desplegar en Firebase:

```bash
firebase deploy
```

## Estructura del Proyecto

```
device-manager/
├── src/
│   ├── components/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   └── templates/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── theme/
│   └── utils/
├── public/
└── ...
```

## Licencia

MIT
