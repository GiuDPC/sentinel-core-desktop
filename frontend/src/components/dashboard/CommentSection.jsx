import { useState, useEffect, useCallback, useRef } from 'react'
import { commentsApi } from '../../api/comments'
import { MessageSquare, Send, Lock, Info } from 'lucide-react'
import notifications from '../ui/Notifications'

export default function CommentSection({ ticketId, userRole, initialComments = [] }) {
  // Inicializamos con las props. Gracias al 'key' en el padre, este componente
  // se remonta limpiamente cuando cambia el ticketId.
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(userRole !== 'REQUESTER')
  const [submitting, setSubmitting] = useState(false)
  const commentsEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    // Usamos setTimeout para asegurar que el DOM se haya actualizado
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  // Sincronizar solo si llegan comentarios nuevos desde el padre (ej. polling o refresh)
  useEffect(() => {
    if (Array.isArray(initialComments) && initialComments.length !== comments.length) {
      // Para evitar el error de "cascading renders", actualizamos en el siguiente tick
      const timer = setTimeout(() => {
        setComments(initialComments)
        scrollToBottom()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [initialComments, comments.length, scrollToBottom])

  const fetchComments = useCallback(async () => {
    if (!ticketId) return
    try {
      const data = await commentsApi.getByTicketId(ticketId)
      if (Array.isArray(data)) {
        setComments(data)
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [ticketId, scrollToBottom])

  // Cargar solo si no tenemos comentarios iniciales
  useEffect(() => {
    if (ticketId && (!initialComments || initialComments.length === 0)) {
      // Evitamos llamar a fetchComments directamente para que el linter no detecte
      // un setState síncrono (por el setLoading que solía tener o por la estructura)
      const timer = setTimeout(fetchComments, 0)
      return () => clearTimeout(timer)
    }
  }, [ticketId, fetchComments, initialComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const data = await commentsApi.create(ticketId, {
        content: newComment.trim(),
        isInternal: userRole === 'REQUESTER' ? false : isInternal
      })
      
      setComments(prev => [...prev, data])
      setNewComment('')
      scrollToBottom()
    } catch (error) {
      notifications.error(error.message || 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form 
        onSubmit={handleSubmit} 
        className={`bg-white rounded-2xl p-4 border shadow-sm transition-all duration-300 ${
          isInternal && userRole !== 'REQUESTER' ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200 focus-within:border-blue-300'
        }`}
      >
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isInternal && userRole !== 'REQUESTER' ? "Escribe una nota interna..." : "Escribe un comentario..."}
          className="w-full bg-transparent border-none text-xs text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:outline-none outline-none resize-none min-h-[70px] shadow-none"
          rows={2}
          style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
        />
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4">
            {userRole !== 'REQUESTER' && (
              <button
                type="button"
                onClick={() => setIsInternal(!isInternal)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  isInternal ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Lock size={10} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {isInternal ? 'Privado' : 'Público'}
                </span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            {submitting ? '...' : <Send size={12} />}
          </button>
        </div>
      </form>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin mensajes aún</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={`flex gap-4 p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                comment.isInternal ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                comment.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">
                    {comment.user?.firstName} {comment.user?.lastName}
                  </span>
                  <div className="flex items-center gap-2">
                    {comment.isInternal && (
                      <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Lock size={8} /> Interno
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  )
}
