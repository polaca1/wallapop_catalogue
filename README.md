# El rincón de Pablo

Catálogo independiente de los anuncios públicos del perfil [Pablo en Wallapop](https://www.wallapop.com/user/ubicacionpablo-481568219). Incluye fotos, títulos, descripciones y precios, con enlaces para ver o comprar cada producto en Wallapop.

## Desplegar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new), conecta GitHub e importa este repositorio.
2. Selecciona **Framework Preset: Other**, **Root Directory: /** y deja los comandos de compilación vacíos. Publica el proyecto.
3. Cada `push` a la rama principal desplegará una versión nueva. Los anuncios se consultan al cargar la web, con caché de cinco minutos.

No se requieren claves de API ni variables de entorno. La función `api/catalog.js` consulta los endpoints públicos de Wallapop desde el servidor; el navegador no necesita acceso directo a su API. Si Wallapop cambia su API o limita las consultas, se muestra la última copia de `snapshot.json` con un aviso visible; actualízala manualmente cuando sea necesario. La compra y el pago se hacen en Wallapop. Este sitio no está afiliado a Wallapop.

## Ejecutar en local

Con Node.js 20 o posterior: `npm run dev` y abre http://localhost:3000. Ejecuta `npm test` para probar la normalización de los datos. No hay dependencias externas.
