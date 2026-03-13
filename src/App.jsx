import useStore from './store/useStore';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  const user = useStore((s) => s.user);
  return user ? <ChatPage /> : <LoginPage />;
}