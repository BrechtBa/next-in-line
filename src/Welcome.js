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

  const [tenant, setTenant] = useState('')
  const navigate = useNavigate();


  const createNewTenant = () => {
    const newTenant = generateString(8)
    const newEditToken = generateString(4)

    repository.addTenant(newTenant, newEditToken);
    navigate(`/${newTenant}/${newEditToken}`);

  }

  const goToTenant = () => {
    navigate(`/${tenant}`);
  }

  return (
    <div style={{flexDirection: 'column', marginTop: '5em'}}>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: '2em'}}>
        <Button onClick={() => createNewTenant()}>Create New Dashboard</Button>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: '2em'}}>
        <TextField value={tenant} onChange={e => setTenant(e.target.value)} label="Dashboard key" />
        <Button onClick={() => goToTenant()}>Open Dashboard</Button>
      </div>
    </div>
  );

}