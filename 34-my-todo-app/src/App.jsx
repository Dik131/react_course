import { useState } from 'react'
import './App.css'
import ThemeSwitch from './components/ThemeSwitch'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Weeky</h1>
      <ThemeSwitch />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </>
  )
}

export default App
