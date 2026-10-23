# Ferretería Oskar — versión 1

Sitio informativo responsive, listo para publicarse como sitio estático. Su objetivo es presentar líneas de productos y facilitar consultas, no vender con carrito ni cobrar en línea.

## Archivos

- `index.html`: contenido, enlaces y metadatos.
- `styles.css`: diseño adaptable y animaciones.
- `script.js`: menú móvil, apariciones al desplazar, filtros de productos y preparación del mensaje de consulta.
- `assets/`: únicamente las imágenes usadas por la página.
- `brief-marca.md`: fuentes, decisiones de marca y límites de la información.

## Vista local

Abre `index.html` en un navegador. Para comprobarlo con servidor local desde esta carpeta:

```powershell
python -m http.server 8000
```

Luego abre `http://127.0.0.1:8000/`.

## Publicación

Sube **todo el contenido de `version 1`** a la raíz de un repositorio de GitHub. La página puede publicarse mediante GitHub Pages (raíz de la rama elegida) o con un servicio para sitios estáticos. No necesita instalación ni compilación.

Cuando exista un dominio final, agrega su URL canónica y actualiza la imagen Open Graph a una URL absoluta. Si se desea indexación, crea `sitemap.xml` y registra el dominio en Google Search Console.

## Contacto y cotización

El botón de WhatsApp utiliza el enlace público del perfil de Facebook. El formulario **prepara un texto**, lo muestra para revisión y permite copiarlo antes de abrir WhatsApp. El visitante debe pegarlo y enviarlo; no hay servidor ni envío automático. Este comportamiento evita mostrar una confirmación falsa de recepción.

El perfil proporcionado es un **perfil personal de Facebook**; el plugin público de feed de Facebook para páginas no ofrece una integración fiable para este formato. Se incluye enlace directo visible en la sección social, contacto y pie de página.

## Imágenes

Se eligieron nueve fotografías de productos enviadas por el cliente. Se copiaron sin modificar. La imagen de portada se creó con IA como composición ilustrativa genérica, sin representar el local real ni mostrar marcas inventadas. El logo original se descargó de la fotografía pública del perfil de Facebook y se muestra con recorte visual CSS en el pie de página; la imagen fuente conserva el fondo original. Más detalle en `brief-marca.md`.

## Datos por confirmar antes de una versión posterior

Horario, teléfono público, disponibilidad actual de cada producto, inventario de equipos en arriendo y dominio definitivo. La versión 1 no los inventa.
