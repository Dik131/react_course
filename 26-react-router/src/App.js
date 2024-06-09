import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="*" element={<h1>404 This page does not exist</h1>} />
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="about" element={<h1>about</h1>} />
          <Route path="contacts" element={<h1>contacts</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
