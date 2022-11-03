import './App.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { EventCollections } from './EventCollection.js'
import { Welcome } from './Welcome.js'



function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/:tenant/:token" element={
            <EventCollections/>
          } />
          <Route path="/:tenant" element={
            <EventCollections/>
          } />
          <Route path="/" element={
            <Welcome />
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
