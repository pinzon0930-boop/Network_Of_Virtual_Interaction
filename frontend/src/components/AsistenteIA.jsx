// Importa hooks de React: useState para manejar datos, useRef para referencias DOM, useEffect para efectos secundarios
import { useState, useRef, useEffect } from 'react'

// Importa la función que llama a la API de Groq para responder preguntas del estudiante
import { preguntarIA } from '../services/groq.js'

// ============================================================
// AsistenteIA — Panel lateral de tutor IA para estudiantes
// Props:
//   visible  → boolean que controla si el panel está abierto o cerrado
//   onClose  → función que se llama al presionar el botón de cerrar
// ============================================================
export default function AsistenteIA({ visible, onClose }) {

  // Estado: lista de mensajes del chat. Empieza con el saludo inicial de la IA
  const [mensajes, setMensajes] = useState([
    {
      rol: 'ia',                                               // Identifica quién envió el mensaje ('ia' o 'usuario')
      texto: '¡Hola! Soy **Educa AI**, tu asistente de estudio 🎓 Puedo ayudarte con cualquier duda académica. ¿Qué quieres aprender hoy?',
    },
  ])

  // Estado: texto que el estudiante está escribiendo en el campo de entrada
  const [input, setInput] = useState('')

  // Estado: true mientras la IA está procesando la respuesta (muestra el indicador de puntos animados)
  const [cargando, setCargando] = useState(false)

  // Referencia al div invisible al final de la lista de mensajes (para hacer scroll automático)
  const bottomRef = useRef(null)

  // Efecto: cada vez que llega un mensaje nuevo o cambia el estado de cargando, hace scroll hacia abajo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) // Desplaza suavemente al último mensaje
  }, [mensajes, cargando])                                     // Se ejecuta cuando cambia mensajes o cargando

  // Función principal: maneja el envío del mensaje cuando el usuario presiona Enter o el botón
  async function handleEnviar(e) {
    e.preventDefault()                                         // Evita que el formulario recargue la página

    const texto = input.trim()                                 // Elimina espacios en blanco al inicio y final
    if (!texto || cargando) return                             // No hace nada si el input está vacío o ya hay una petición en curso

    setInput('')                                               // Limpia el campo de texto inmediatamente
    setMensajes(prev => [...prev, { rol: 'usuario', texto }])  // Agrega el mensaje del usuario a la lista
    setCargando(true)                                          // Activa el indicador de carga (puntos animados)

    try {
      const respuesta = await preguntarIA(texto)               // Llama a la API de Groq y espera la respuesta
      setMensajes(prev => [...prev, { rol: 'ia', texto: respuesta }]) // Agrega la respuesta de la IA a la lista
    } catch {
      // Si ocurre cualquier error (red, API caída, etc.), muestra mensaje de error en el chat
      setMensajes(prev => [
        ...prev,
        { rol: 'ia', texto: '❌ Hubo un error al conectar con la IA. Intenta de nuevo.' },
      ])
    } finally {
      setCargando(false)                                       // Siempre desactiva el indicador de carga al terminar
    }
  }

  // Convierte el texto de la IA: **texto** → <strong>texto</strong> y \n → <br/> para mostrar formato en HTML
  function renderTexto(texto) {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')        // Reemplaza **negrita** con etiqueta HTML <strong>
      .replace(/\n/g, '<br/>')                                 // Reemplaza saltos de línea con <br/> para mostrarlos en el navegador
  }

  return (
    <>
      {/* Capa oscura semitransparente que aparece detrás del panel en pantallas móviles */}
      {visible && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden" // Solo visible en móvil (lg:hidden = oculto en pantallas grandes)
          onClick={onClose}                                      // Al hacer clic en el overlay, cierra el panel
        />
      )}

      {/* Panel lateral deslizante — entra desde la derecha */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900
          shadow-2xl z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${visible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ── CABECERA DEL PANEL ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
          {/* Nombre e ícono del asistente */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>             {/* Ícono del robot */}
            <div>
              <p className="font-semibold text-sm leading-tight">Educa AI</p>    {/* Nombre del asistente */}
              <p className="text-indigo-200 text-xs">Tutor inteligente</p>       {/* Subtítulo */}
            </div>
          </div>

          {/* Botón X para cerrar el panel */}
          <button
            onClick={onClose}                                  // Llama a la función de cierre pasada como prop
            className="p-1 rounded-lg hover:bg-indigo-700 transition-colors"
            aria-label="Cerrar"                               // Accesibilidad: describe el botón para lectores de pantalla
          >
            {/* Ícono X hecho con SVG */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── ÁREA DE MENSAJES ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"> {/* flex-1 hace que ocupe todo el espacio disponible */}

          {/* Renderiza cada mensaje de la conversación */}
          {mensajes.map((m, i) => (
            <div
              key={i}                                          // Key única para React (índice del mensaje)
              className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`} // Mensajes del usuario a la derecha, IA a la izquierda
            >
              {/* Ícono del robot — solo se muestra antes de mensajes de la IA */}
              {m.rol === 'ia' && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <span className="text-xs">🤖</span>
                </div>
              )}

              {/* Burbuja del mensaje con el texto formateado */}
              <div
                className={`
                  max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                  ${m.rol === 'usuario'
                    ? 'bg-indigo-600 text-white rounded-br-sm'                          // Burbuja morada para el usuario
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm' // Burbuja gris para la IA
                  }
                `}
                dangerouslySetInnerHTML={{ __html: renderTexto(m.texto) }} // Inserta HTML procesado (negrita, saltos de línea)
              />
            </div>
          ))}

          {/* Indicador de "escribiendo..." — aparece mientras la IA procesa la respuesta */}
          {cargando && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs">🤖</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                {/* Tres puntos que rebotan con retraso entre sí para crear efecto de escritura */}
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />   {/* Primer punto */}
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /> {/* Segundo punto (retraso 150ms) */}
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /> {/* Tercer punto (retraso 300ms) */}
                </div>
              </div>
            </div>
          )}

          {/* Div invisible al final de la lista — el scroll automático apunta aquí */}
          <div ref={bottomRef} />
        </div>

        {/* ── ÁREA DE ENTRADA DE TEXTO ── */}
        <form
          onSubmit={handleEnviar}                              // Al enviar el formulario, ejecuta handleEnviar
          className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <div className="flex gap-2 items-end">

            {/* Campo de texto donde el estudiante escribe su pregunta */}
            <textarea
              value={input}                                    // Valor controlado por el estado 'input'
              onChange={e => setInput(e.target.value)}         // Actualiza el estado con cada tecla presionada
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {        // Enter solo envía (Shift+Enter permite salto de línea)
                  e.preventDefault()                           // Evita que Enter agregue una línea en blanco
                  handleEnviar(e)                              // Envía el mensaje
                }
              }}
              placeholder="Escribe tu pregunta..."             // Texto de ayuda cuando el campo está vacío
              rows={1}                                         // Altura inicial de una línea (crece automáticamente)
              className="
                flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500
                max-h-24 overflow-y-auto
              "
              style={{ minHeight: '38px' }}                    // Altura mínima del textarea en píxeles
            />

            {/* Botón de enviar con ícono de avión de papel */}
            <button
              type="submit"                                    // Tipo submit activa el onSubmit del formulario
              disabled={!input.trim() || cargando}            // Deshabilitado si no hay texto o ya hay una petición en curso
              className="
                p-2 bg-indigo-600 text-white rounded-xl
                hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors flex-shrink-0
              "
            >
              {/* Ícono SVG de avión de papel (símbolo de enviar) */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Pie del panel: indica la tecnología que alimenta el asistente */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
            Powered by Groq · openai/gpt-oss-20b · Gratis
          </p>
        </form>
      </div>
    </>
  )
}
