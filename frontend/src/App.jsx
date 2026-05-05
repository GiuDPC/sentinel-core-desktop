import { AppRouter } from './routes/router'
import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster duration={5000} position="bottom-right" />
    </>
  )
}