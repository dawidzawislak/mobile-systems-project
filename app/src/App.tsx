import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Plan from "./pages/Plan";
import NewDay from "./pages/NewDay";
import Schedule from "./pages/Schedule";
import ChooseCategories from "./pages/ChooseCategories";
import Map from "./pages/Map";
import HomePage from "./pages/HomePage";
import Header from "./components/Header";

export default function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/new-day/:id" element={<NewDay />} />
            <Route path="/categories" element={<ChooseCategories />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/map" element={<Map />} />
            <Route path="/details/:id" element={<></>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
