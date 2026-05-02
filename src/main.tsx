import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import { BookDetailPage } from './pages/BookDetailPage'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './store/useAuthStore'
import { useBookStore } from './store/useBookStore'
import { useKnowledgeStore } from './store/useKnowledgeStore'
import './index.css'

// 认证守卫组件
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializeAuth } = useAuthStore()
  const { fetchBooks } = useBookStore()
  const { fetchNotes, fetchTags, fetchRelations, fetchEvents } = useKnowledgeStore()

  useEffect(() => {
    // 初始化认证状态
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // 如果已登录，获取数据
    if (isAuthenticated) {
      fetchBooks()
      fetchNotes()
      fetchTags()
      fetchRelations()
      fetchEvents()
    }
  }, [isAuthenticated, fetchBooks, fetchNotes, fetchTags, fetchRelations, fetchEvents])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// 登录页面守卫（已登录用户跳转到首页）
function LoginGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <LoginGuard>
              <LoginPage />
            </LoginGuard>
          } 
        />
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <App />
            </AuthGuard>
          } 
        />
        <Route 
          path="/book/:bookId" 
          element={
            <AuthGuard>
              <BookDetailPage />
            </AuthGuard>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
