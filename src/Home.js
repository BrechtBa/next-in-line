import { useState } from 'react';
import { useNavigate } from "react-router-dom";

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { getRepository } from './repository/firebase.js'

const repository = getRepository();


export function ViewHome() {

  const [dashboardKey, setDashboardKey] = useState('')
  const [openDialogOpen, setOpenDialogOpen] = useState(false)
  const navigate = useNavigate();


  const createNewDashboard = () => {
    repository.addDashboard((newDashboardKey, newToken) => {
      if(newDashboardKey !== null) {
        navigate(`/${newDashboardKey}/${newToken}`);
      }
    }, (error) => {
      console.error(error);
    });
  }

  return (
    <div>
      <div style={{flexDirection: 'column', marginTop: '5em'}}>

        <div style={{display: 'flex', justifyContent: 'center', marginTop: '2em'}}>
          <Button onClick={() => setOpenDialogOpen(true)} variant="outlined">Open existing Dashboard</Button>
        </div>

        <div style={{display: 'flex', justifyContent: 'center', marginTop: '2em'}}>
          <Button onClick={() => createNewDashboard()} variant="outlined">Create New Dashboard</Button>
        </div>
      </div>

      <Dialog open={openDialogOpen} onClose={() => setOpenDialogOpen(false)}>
        <div style={{margin: '1em'}}>
          <h1>Open Dashboard</h1>

          <TextField value={dashboardKey} onChange={e => setDashboardKey(e.target.value)} onKeyPress={(e) => (e.key === 'Enter') && navigate(`/${dashboardKey}`)}label="Dashboard key" />

          <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
            <Button onClick={() => navigate(`/${dashboardKey}`)}>Open</Button>
            <Button onClick={() => setOpenDialogOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );

}