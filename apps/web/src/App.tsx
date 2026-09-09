import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoot } from './app/AppRoot'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoot />
    </QueryClientProvider>
  )
}

export default App
