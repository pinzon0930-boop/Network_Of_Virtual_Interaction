import { useState } from 'react'               // useState para manejar el formulario.
import { crearGrupo } from '../services/grupos.js' // Función para crear el grupo en Supabase.
import { useAuth } from '../context/AuthContext.jsx' // Para obtener el ID del profesor.

// ============================================================
// COMPONENTE: CrearGrupo
// ============================================================
// Muestra un formulario para que el profesor cree un nuevo grupo.
// Cuando el grupo se crea, llama a onGrupoCreado para que la página
// padre actualice la lista de grupos.
// Props:
//   - onGrupoCreado: función que se llama cuando el grupo fue creado.
//   - onCancelar: función que se llama cuando el usuario cancela.
// ============================================================
export default function CrearGrupo({ onGrupoCreado, onCancelar }) {

  // Estado para el nombre del grupo (campo obligatorio).
  const [nombre, setNombre] = useState('')

  // Estado para la descripción del grupo (campo opcional).
  const [descripcion, setDescripcion] = useState('')

  // Estado para mostrar errores en el formulario.
  const [error, setError] = useState('')

  // Estado para mostrar el spinner mientras se guarda.
  const [cargando, setCargando] = useState(false)

  // Obtenemos el perfil del profesor (necesitamos su ID).
  const { perfil } = useAuth()

  // ============================================================
  // FUNCIÓN: handleSubmit
  // ============================================================
  // Se ejecuta cuando el profesor hace clic en "Crear grupo".
  // Valida los campos y llama a crearGrupo().
  // ============================================================
  async function handleSubmit(e) {
    e.preventDefault() // Evita que la página se recargue al enviar el formulario.

    // Validación: el nombre es obligatorio.
    if (!nombre.trim()) {
      setError('El nombre del grupo es obligatorio.')
      return // Sale de la función sin continuar.
    }

    setCargando(true) // Muestra el spinner.
    setError('')      // Limpia errores anteriores.

    // Llama a la función para crear el grupo en Supabase.
    const { data, error: errorCrear } = await crearGrupo(
      nombre.trim(),       // Nombre del grupo (sin espacios extra).
      descripcion.trim(),  // Descripción (puede estar vacía).
      perfil.id            // ID del profesor actual.
    )

    setCargando(false) // Oculta el spinner.

    // Si hubo error, lo mostramos.
    if (errorCrear) {
      setError('Error al crear el grupo. Intenta de nuevo.')
      return
    }

    // Si se creó correctamente, avisamos a la página padre.
    onGrupoCreado(data)
  }

  // ============================================================
  // RENDER: Formulario de creación de grupo
  // ============================================================
  return (
    // Overlay oscuro de fondo (modal).
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      {/* Caja del modal */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">

        {/* Título del modal */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Crear nuevo grupo
        </h2>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo: Nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del grupo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)} // Actualiza el estado al escribir.
              placeholder="Ej: Matemáticas 10°, Física General..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={100} // Máximo 100 caracteres.
            />
          </div>

          {/* Campo: Descripción (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)} // Actualiza el estado al escribir.
              placeholder="Describe brevemente el grupo..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}        // Altura de 3 líneas.
              maxLength={500} // Máximo 500 caracteres.
            />
          </div>

          {/* Mensaje de error si algo falló */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">

            {/* Botón cancelar */}
            <button
              type="button"
              onClick={onCancelar} // Llama a la función de cancelar del padre.
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>

            {/* Botón crear */}
            <button
              type="submit"
              disabled={cargando} // Desactiva el botón mientras carga.
              className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
            >
              {/* Muestra "Creando..." mientras carga, o "Crear grupo" si no */}
              {cargando ? 'Creando...' : 'Crear grupo'}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}
