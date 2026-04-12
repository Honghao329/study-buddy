import { HashRouter, Routes, Route } from 'react-router-dom';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Community from './pages/Community';
import CheckinList from './pages/CheckinList';
import CheckinDetail from './pages/CheckinDetail';
import My from './pages/My';
import NoteDetail from './pages/NoteDetail';
import NoteAdd from './pages/NoteAdd';
import Sign from './pages/Sign';
import Messages from './pages/Messages';
import Partner from './pages/Partner';
import Favorite from './pages/Favorite';
import UserProfile from './pages/UserProfile';
import MyNotes from './pages/MyNotes';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 max-w-[430px] mx-auto relative" style={{ fontFamily: 'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<><Home /><TabBar /></>} />
          <Route path="/community" element={<><Community /><TabBar /></>} />
          <Route path="/checkin" element={<><CheckinList /><TabBar /></>} />
          <Route path="/my" element={<><My /><TabBar /></>} />
          <Route path="/checkin/:id" element={<CheckinDetail />} />
          <Route path="/note/:id" element={<NoteDetail />} />
          <Route path="/note/add" element={<NoteAdd />} />
          <Route path="/sign" element={<Sign />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/my/notes" element={<MyNotes />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
