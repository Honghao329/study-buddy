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

export default function App() {
  return (
    <HashRouter>
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
      </Routes>
    </HashRouter>
  );
}
