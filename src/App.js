import './App.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ViewEventCollections } from './EventCollection.js'
import { ViewHome } from './Home.js'


function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/:dashboard/:token" element={
            <ViewEventCollections/>
          } />
          <Route path="/:dashboard" element={
            <ViewEventCollections/>
          } />
          <Route path="/" element={
            <ViewHome />
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
