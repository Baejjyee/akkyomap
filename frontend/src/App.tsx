import { Route, Routes } from 'react-router-dom'
import './styles.css'
import { AdminRoute } from './auth/AdminRoute'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppHeader } from './components/AppHeader'
import { AdminPendingPlacesPage } from './pages/AdminPendingPlacesPage'
import { LoginPage } from './pages/LoginPage'
import { MapPage } from './pages/MapPage'
import { MyPlacesPage } from './pages/MyPlacesPage'
import { PlaceEditPage } from './pages/PlaceEditPage'
import { SignupPage } from './pages/SignupPage'

function App() {
  return (
    <main className="app">
      <AppHeader />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/my/places"
          element={
            <ProtectedRoute>
              <MyPlacesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my/places/:placeId/edit"
          element={
            <ProtectedRoute>
              <PlaceEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/places/pending"
          element={
            <AdminRoute>
              <AdminPendingPlacesPage />
            </AdminRoute>
          }
        />
      </Routes>
    </main>
  )
}

export default App
