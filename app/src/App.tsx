import { useState } from 'react';
import './App.css';
import { ChatWindow } from './components/ChatWindow';
import { v4 as uuid } from 'uuid';

const pageId = uuid().substring(32);

const { VITE_SIGNAL_URL } = import.meta.env;

console.log('url', VITE_SIGNAL_URL);

function App() {
  const [numPeers, setNumPeers] = useState(1);

  const simulatedPeers = Array.from({ length: numPeers }).map(
    (_, i) => `${pageId}-${i}`,
  );

  return (
    <>
      <input
        type="number"
        value={numPeers}
        onChange={(e) => setNumPeers(parseInt(e.target.value))}
      ></input>
      {simulatedPeers.map((peerId) => (
        <ChatWindow key={peerId} peerId={peerId} />
      ))}
    </>
  );
}

export default App;
