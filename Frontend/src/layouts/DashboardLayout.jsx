import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AiChatbot from '../components/AiChatbot/AiChatbot';

export default function DashboardLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <AiChatbot />
    </div>
  );
}

