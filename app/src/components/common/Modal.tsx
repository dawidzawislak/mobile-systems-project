import { useEffect, useRef, type FC, type ReactNode } from 'react'
import { CloseIcon } from '../icons'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string 
  children: ReactNode
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 backdrop-blur-md bg-white/30">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-orange-200"
      >
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Modal
