import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import './App.css';

const AppContent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="app">
        <Chat />
      </div>
    );
  }

  return (
    <div className="app">
      {isLogin ? (
        <Login switchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register switchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;