// import React, { useState, useRef, useEffect } from 'react'
// import classNames from 'classnames'

// interface Option {
//   value: string
//   label: string
// }

// interface CustomSelectProps {
//   options: Option[]
//   value: string
//   onChange: (value: string) => void
//   placeholder?: string
//   disabled?: boolean
//   className?: string
//   id?: string
// }

// const CustomSelect: React.FC<CustomSelectProps> = ({
//   options,
//   value,
//   onChange,
//   placeholder = 'Wybierz...',
//   disabled = false,
//   className = '',
//   id,
// }) => {
//   const [isOpen, setIsOpen] = useState(false)
//   const [highlightedIndex, setHighlightedIndex] = useState(0)
//   const selectRef = useRef<HTMLDivElement>(null)

//   const selectedOption = options.find((option) => option.value === value)

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         selectRef.current &&
//         !selectRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false)
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside)
//     }
//   }, [])

//   useEffect(() => {
//     if (!isOpen) return

//     const handleKeyDown = (e: KeyboardEvent) => {
//       switch (e.key) {
//         case 'ArrowDown':
//           e.preventDefault()
//           setHighlightedIndex((prev) =>
//             prev < options.length - 1 ? prev + 1 : prev
//           )
//           break
//         case 'ArrowUp':
//           e.preventDefault()
//           setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
//           break
//         case 'Enter':
//           e.preventDefault()
//           if (options[highlightedIndex]) {
//             onChange(options[highlightedIndex].value)
//             setIsOpen(false)
//           }
//           break
//         case 'Escape':
//           e.preventDefault()
//           setIsOpen(false)
//           break
//       }
//     }

//     document.addEventListener('keydown', handleKeyDown)
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown)
//     }
//   }, [isOpen, highlightedIndex, options, onChange])

//   useEffect(() => {
//     if (isOpen) {
//       const selectedIndex = options.findIndex(
//         (option) => option.value === value
//       )
//       setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
//     }
//   }, [isOpen, options, value])

//   return (
//     <div
//       className={classNames(
//         'relative w-full',
//         disabled && 'opacity-60 pointer-events-none',
//         className
//       )}
//       ref={selectRef}
//       id={id}
//     >
//       <div
//         className={classNames(
//           'flex items-center justify-between p-[6px] border rounded bg-white cursor-pointer transition-colors duration-200',
//           isOpen ? 'border-purple-500' : 'border-gray-300',
//           'hover:border-gray-400'
//         )}
//         onClick={() => !disabled && setIsOpen((prev) => !prev)}
//         role="combobox"
//         aria-expanded={isOpen}
//         aria-haspopup="listbox"
//         tabIndex={disabled ? -1 : 0}
//       >
//         <span className={!selectedOption ? 'text-gray-500' : ''}>
//           {selectedOption ? selectedOption.label : placeholder}
//         </span>
//         <svg
//           className={classNames(
//             'w-4 h-4 transform transition-transform duration-200',
//             isOpen ? 'rotate-180' : ''
//           )}
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M19 9l-7 7-7-7"
//           />
//         </svg>
//       </div>

//       {isOpen && (
//         <ul
//           className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto animate-fadeIn"
//           role="listbox"
//           style={{
//             animation: 'fadeIn 0.2s ease-in-out',
//           }}
//         >
//           {options.map((option, index) => (
//             <li
//               key={option.value}
//               className={classNames(
//                 'p-2 cursor-pointer transition-colors duration-150',
//                 highlightedIndex === index && 'bg-purple-100',
//                 option.value === value && 'bg-purple-50',
//                 'hover:bg-purple-100'
//               )}
//               onClick={() => {
//                 onChange(option.value)
//                 setIsOpen(false)
//               }}
//               onMouseEnter={() => setHighlightedIndex(index)}
//               role="option"
//               aria-selected={option.value === value}
//             >
//               {option.label}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   )
// }

// export default CustomSelect
