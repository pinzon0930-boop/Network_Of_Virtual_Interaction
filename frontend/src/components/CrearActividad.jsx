import { useState } from 'react'                          // Hook de estado.
import { crearActividad } from '../services/actividades.js' // Función para crear actividades.
import { useAuth } from '../context/AuthContext.jsx'         // Para obtener el ID del profesor.

// ============================================================
// COMPONENTE: CrearActividad
// ============================================================
// Modal que permite al profesor crear una nueva actividad.
// Props:
//   - grupoId: ID del grupo donde se publica la actividad.
//   - onActividadCreada(actividad): se llama cuando se crea exitosamente.
//   - onCancelar(): se llama cuando el profesor cancela.
// ============================================================
export default function CrearActividad({ grupoId, onActividadCreada, onCancelar }) {

  // Título de la actividad (obligatorio).
  const [titulo, setTitulo] = useState('')

  // Descripción o instrucciones (opcional).
  const [descripcion, setDescripcion] = useState('')

  // Fecha y hora límite de entrega (opcional).
  const [fechaEntrega, setFechaEntrega] = useState('')

  // Estado de carga al guardar.
  const [cargando, setCargando] = useState(false)

  // Mensaje de error si algo falla.
  const [error, setError] = useState('')

  // Obtenemos el perfil del usuario (necesitamos su ID como profesor).
  const { perfil } = useAuth()

  // ============================================================
  // FUNCIÓN: handleSubmit
  // ============================================================
  // Se ejecuta cuando el profesor hace clic en "Crear actividad".
  // ============================================================
  async function handleSubmit(e) {
    e.preventDefault() // Evita que la página se recargue.

    // Validar que el título no esté vacío.
    if (!titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }

    setCargando(true) // Muestra el spinner.
    setError('')      // Limpia errores anteriores.

    // Inserta la actividad en Supabase.
    const { data, error: errorCrear } = await crearActividad(
      grupoId,
      titulo.trim(),
      descripcion.trim(),
      fechaEntrega || null,
      perfil.id
    )

    setCargando(false) // Oculta el spinner.

    // Si hubo error, lo mostramos.
    if (errorCrear) {
      setError('Error al crear la actividad. Intenta de nuevo.')
      return
    }

    // Si se creó correctamente, notificamos al componente padre.
    onActividadCreada(data)
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // Overlay oscuro que cubre toda la pantalla.
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

      {/* Tarjeta del modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        {/* Título del modal */}
        <h2 className="text-xl font-bold text-gray-800 mb-5">📋 Nueva actividad</h2>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo: Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)} // Actualiza el estado al escribir.
              placeholder="Ej: Taller de matemáticas #1"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={200} // Máximo 200 caracteres.
              autoFocus       // El cursor se posiciona aquí al abrir el modal.
            />
          </div>

          {/* Campo: Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
              <span className="text-gray-400 text-xs ml-1">(opcional)</span>
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)} // Actualiza el estado.
              placeholder="Instrucciones de la actividad..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}         // 3 filas de altura.
              maxLength={1000} // Máximo 1000 caracteres.
            />
          </div>

          {/* Campo: Fecha de entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de entrega
              <span className="text-gray-400 text-xs ml-1">(opcional)</span>
            </label>
            <input
              type="datetime-local"                         // Selector de fecha y hora.
              value={fechaEntrega}
              onChange={e => setFechaEntrega(e.target.value)} // Actualiza el estado.
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Botones: Cancelar y Crear */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelar} // Cierra el modal sin guardar.
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando} // Desactiva mientras carga.
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
            >
              {cargando ? 'Creando...' : 'Crear actividad'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
