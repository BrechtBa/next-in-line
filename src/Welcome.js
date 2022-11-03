import { useNavigate } from "react-router-dom";

import Button from '@mui/material/Button';

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
  const navigate = useNavigate();

  const createNewTenant = () => {
    const tenant = generateString(8)
    const editToken = generateString(4)

    console.log(`/${tenant}/${editToken}`)
    repository.addTenant(tenant, editToken);
    navigate(`/${tenant}/${editToken}`);

  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', marginTop: '5em'}}>
      <Button onClick={() => createNewTenant()}>Create New View</Button>
    </div>
  );

}