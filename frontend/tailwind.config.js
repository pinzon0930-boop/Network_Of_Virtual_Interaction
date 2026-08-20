// Configuración de Tailwind CSS.
/** @type {import('tailwindcss').Config} */
export default {
  // Indica a Tailwind en qué archivos buscar las clases CSS que se usan.
  content: [
    "./index.html",        // Busca clases en el archivo HTML principal.
    "./src/**/*.{js,jsx}", // Busca clases en todos los archivos JS y JSX de la carpeta src.
  ],
  theme: {
    extend: {
      // Aquí se pueden agregar colores, fuentes o tamaños personalizados.
      colors: {
        primary: '#4F46E5',   // Color principal: índigo para botones y elementos destacados.
        secondary: '#7C3AED', // Color secundario: violeta para acentos.
      },
    },
  },
  plugins: [], // Aquí se pueden agregar plugins adicionales de Tailwind.
}
