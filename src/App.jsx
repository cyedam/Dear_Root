import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import Main from './pages/Main/Main.jsx'
import CareTest from './pages/CareTest/CareTest.jsx'
import Products from './pages/Products/Products.jsx'
import Guide from './pages/Guide/Guide.jsx'
import { ROUTES } from './routes.js'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.main} element={<Main />} />
        <Route path={ROUTES.careTest} element={<CareTest />} />
        <Route path={ROUTES.products} element={<Products />} />
        <Route path={ROUTES.guide} element={<Guide />} />
        <Route path="*" element={<Main />} />
      </Route>
    </Routes>
  )
}

export default App
