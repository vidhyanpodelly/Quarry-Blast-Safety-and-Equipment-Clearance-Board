import { SafetyProvider } from './safety/SafetyContext'
import { Dashboard } from './components/Dashboard'

function App() {
  return (
    <SafetyProvider>
      <Dashboard />
    </SafetyProvider>
  )
}

export default App
