import React from 'react'               // Importa React para poder usar JSX.
import ReactDOM from 'react-dom/client' // Importa ReactDOM para renderizar la app en el navegador.
import App from './App.jsx'             // Importa el componente principal de la aplicación.
import './index.css'                    // Importa los estilos globales (incluye Tailwind CSS).

// Busca el elemento con id="root" en el index.html y monta la app de React ahí.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* StrictMode ayuda a detectar problemas durante el desarrollo. */}
    <App />
  </React.StrictMode>,
)
