import { useState, useRef, useEffect } from 'react'
import { preguntarIA } from '../services/groq.js'

// ============================================================
// AsistenteIA — Panel lateral de tutor IA para estudiantes
// ============================================================
export default function AsistenteIA({ visible, onClose }) {
  const [mensajes, setMensajes] = useState([
    {
      rol: 'ia',
      texto: '¡Hola! Soy **Educa AI**, tu asistente de estudio 🎓 Puedo ayudarte con cualquier duda académica. ¿Qué quieres aprender hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  async function handleEnviar(e) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || cargando) return

    setInput('')
    setMensajes(prev => [...prev, { rol: 'usuario', texto }])
    setCargando(true)

    try {
      const respuesta = await preguntarIA(texto)
      setMensajes(prev => [...prev, { rol: 'ia', texto: respuesta }])
    } catch {
      setMensajes(prev => [
        ...prev,
        { rol: 'ia', texto: '❌ Hubo un error al conectar con la IA. Intenta de nuevo.' },
      ])
    } finally {
      setCargando(false)
    }
  }

  // Convierte **negrita** y saltos de línea a HTML simple
  function renderTexto(texto) {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <>
      {/* Overlay oscuro al abrir en móvil */}
      {visible && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel lateral */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900
          shadow-2xl z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${visible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-sm leading-tight">Educa AI</p>
              <p className="text-indigo-200 text-xs">Tutor inteligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-indigo-700 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              {m.rol === 'ia' && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <span className="text-xs">🤖</span>
                </div>
              )}
              <div
                className={`
                  max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                  ${m.rol === 'usuario'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                  }
                `}
                dangerouslySetInnerHTML={{ __html: renderTexto(m.texto) }}
              />
            </div>
          ))}

          {cargando && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs">🤖</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleEnviar}
          className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleEnviar(e)
                }
              }}
              placeholder="Escribe tu pregunta..."
              rows={1}
              className="
                flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500
                max-h-24 overflow-y-auto
              "
              style={{ minHeight: '38px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || cargando}
              className="
                p-2 bg-indigo-600 text-white rounded-xl
                hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors flex-shrink-0
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
            Powered by Groq · llama3-8b-8192 · Gratis
          </p>
        </form>
      </div>
    </>
  )
}
