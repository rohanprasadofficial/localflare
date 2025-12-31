import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import D1Explorer from './components/d1/D1Explorer'
import KVExplorer from './components/kv/KVExplorer'
import R2Explorer from './components/r2/R2Explorer'
import DOExplorer from './components/do/DOExplorer'
import QueuesExplorer from './components/queues/QueuesExplorer'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/d1" element={<D1Explorer />} />
          <Route path="/kv" element={<KVExplorer />} />
          <Route path="/r2" element={<R2Explorer />} />
          <Route path="/do" element={<DOExplorer />} />
          <Route path="/queues" element={<QueuesExplorer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
