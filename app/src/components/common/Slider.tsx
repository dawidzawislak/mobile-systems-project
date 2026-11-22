import React, { useState, useEffect, type FC } from 'react'

type SliderProps = {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
  isInteger?: boolean
  className?: string
}

const Slider: FC<SliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  disabled = false,
  label,
  isInteger = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    value !== undefined && value !== null ? value.toString() : ''
  )

  useEffect(() => {
    setInputValue(value !== undefined && value !== null ? value.toString() : '')
  }, [value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(isInteger ? Math.round(newValue) : newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value
    setInputValue(newInputValue)

    if (newInputValue === '' || isNaN(Number(newInputValue))) {
      return
    }

    const newValue = parseFloat(newInputValue)

    if (newValue >= min && newValue <= max) {
      onChange(isInteger ? Math.round(newValue) : newValue)
    }
  }

  const handleInputBlur = () => {
    if (inputValue === '' || isNaN(Number(inputValue))) {
      setInputValue(
        value !== undefined && value !== null ? value.toString() : '0'
      )
      return
    }

    let newValue = parseFloat(inputValue)

    if (newValue < min) newValue = min
    if (newValue > max) newValue = max

    const finalValue = isInteger ? Math.round(newValue) : newValue
    setInputValue(finalValue.toString())
    onChange(finalValue)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-400"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="w-20 p-1 text-center border rounded"
          size={5}
        />
      </div>
    </div>
  )
}

export default Slider
