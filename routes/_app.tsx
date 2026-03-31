import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* 1. Aquí cambias el nombre que aparece en la pestaña */}
        <title>Hermes</title>
        
        {/* 2. Aquí enlazas la foto del corazón para que sea el icono de la pestaña */}
        <link rel="icon" href="/corazon.png" type="image/png" />
        
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}