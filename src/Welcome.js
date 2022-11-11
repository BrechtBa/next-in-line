import { useState } from 'react';
import { useNavigate } from "react-router-dom";

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { getRepository } from './repository/firebase.js'

const repository = getRepository();


function generateString(length) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export function Welcome() {

  const [dashboardKey, setDashboardKey] = useState('')
  const navigate = useNavigate();


  const createNewDashboard = () => {
    const newDashboardKey = generateString(8)
    const newToken = generateString(4)

    repository.addDashboard(newDashboardKey, newToken);
    navigate(`/${newDashboardKey}/${newToken}`);
  }

  return (
    <div style={{flexDirection: 'column', marginTop: '5em'}}>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: '2em'}}>
        <Button onClick={() => createNewDashboard()}>Create New Dashboard</Button>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: '2em'}}>
        <TextField value={dashboardKey} onChange={e => setDashboardKey(e.target.value)} label="Dashboard key" />
        <Button onClick={() => navigate(`/${dashboardKey}`)}>Open Dashboard</Button>
      </div>
    </div>
  );

}