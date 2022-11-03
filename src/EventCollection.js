import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";

import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import CreateIcon from '@mui/icons-material/Create';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';

import { AdminEvent, ViewEvent, EditEventDialog } from './Event.js'

import { EventCollection } from './Domain.js'
import { getRepository } from './repository/firebase.js'


const repository = getRepository();


function ViewEventCollection(props) {
  const eventCollection = props.eventCollection;

  return (
    <Paper style={{position: 'relative', margin: '1em', padding: '0.01em', backgroundColor: '#f5f5f5'}}>

      <h1 style={{marginLeft: '1em'}}>{eventCollection.title}</h1>

      <div style={{margin: '1em'}}>
        {eventCollection.getActiveEvents().map(event => (
          <ViewEvent key={event.key} event={event}/>
        ))}
      </div>

    </Paper>
  );
}


function EditCollectionDialog(props) {
  const collection = props.collection;
  const open = props.open;
  const setOpen = props.setOpen;
  const onSave = props.onSave;

 const [collectionData, setCollectionData] = useState({
    title: 'New Collection',
  })

  useEffect(() => {
    if(collection === null) {
      setCollectionData({
        title: 'New Collection',
      })
    }
    else {
      setCollectionData({
        title: collection.title,
      })
    }
  }, [collection]);

  const handleSave = () => {
    setOpen(false);
    onSave(collectionData);
  }

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <div style={{margin: '1em'}}>
        <h1>Edit Collection</h1>
        <div>
          <Stack spacing={2}>
            <TextField value={collectionData.title} onChange={e => setCollectionData({...collectionData, title: e.target.value})} label="Title" />
          </Stack>
        </div>
        <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </Dialog>
  )
}


function AdminEventCollection(props) {
  const tenant = props.tenant;
  const eventCollection = props.eventCollection;
  const setEventCollection = props.setEventCollection;

  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);


  const setEvent = (event) => {
    const newEvents = eventCollection.events.map(e => {
      if(e.key === event.key) {
        return event;
      }
      return e;
    })
    const newCollection = new EventCollection({key: eventCollection.key, title: eventCollection.title, events: newEvents});
    repository.setEventCollection(tenant, newCollection);
    setEventCollection(newCollection);
  }

  const addEvent = (eventData) => {
    repository.addEvent(tenant, eventCollection, eventData);
  }

  return (
    <Paper style={{position: 'relative', margin: '1em', padding: '0.01em', backgroundColor: '#f5f5f5'}}>

      <div style={{position: 'absolute', top: 0, right: 0}}>
        <IconButton aria-label="Example" onClick={()=>setEditDialogOpen(true)}>
          <CreateIcon />
        </IconButton>
      </div>

      <h1 style={{marginLeft: '1em'}}>{eventCollection.title}</h1>

      <div style={{margin: '1em'}}>
        {eventCollection.getAllEvents().map(event => (
          <AdminEvent key={event.key} event={event} setEvent={setEvent}/>
        ))}
      </div>

      <div style={{textAlign: 'center'}}>
        <Fab color="primary" aria-label="add" onClick={() => setAddEventDialogOpen(true)}>
          <AddIcon />
        </Fab>
      </div>

      <EditEventDialog open={addEventDialogOpen} setOpen={setAddEventDialogOpen} onSave={eventData => addEvent(eventData)} event={null} />
      <EditCollectionDialog open={editDialogOpen} setOpen={setEditDialogOpen} onSave={collectionData => setEventCollection(eventCollection.update(collectionData))} collection={eventCollection}/>
    </Paper>
  );
}


export function ViewEventCollections(props) {
  const tenant = props.tenant;

  const [eventCollections, setEventCollections] = useState([])

  useEffect(() => {
    repository.onEventCollectionsChanged(tenant, collections => {
      setEventCollections(collections);
    });
  }, [tenant]);

  return (
    <div style={{display: 'flex', flexDirection: 'row', wrap: 'wrap'}}>
      {eventCollections.map(collection => (
        <div key={collection.key} style={{minWidth: '400px', flexGrow: 1}}>
          <ViewEventCollection eventCollection={collection}/>
        </div>
      ))}
    </div>
  )

}


export function AdminEventCollections(props) {
  const tenant = props.tenant;

  const [eventCollections, setEventCollections] = useState([])

  useEffect(() => {
    repository.onEventCollectionsChanged(tenant, collections => {
      setEventCollections(collections);
    });
  }, [tenant]);

  const [addEventCollectionDialogOpen, setAddEventCollectionDialogOpen] = useState(false);

  const setEventCollection = (collection) => {
    repository.setEventCollection(tenant, collection);
  }

  const addCollection = (collectionData) => {
    repository.addEventCollection(tenant, collectionData)
  };
  return (
    <div style={{display: 'flex', flexDirection: 'row', wrap: 'wrap'}}>
      {eventCollections.map(collection => (
        <div key={collection.key} style={{minWidth: '400px', flexGrow: 1}}>
          <AdminEventCollection tenant={tenant} eventCollection={collection} setEventCollection={setEventCollection}/>
        </div>
      ))}
      <Paper elevation={0} style={{margin: '1em', padding: '0.5em', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center',
                                   borderStyle: 'dashed', borderColor: '#f0f0f0'}}>

        <Fab color="primary" aria-label="add" onClick={() => setAddEventCollectionDialogOpen(true)}>
          <AddIcon />
        </Fab>
        <EditCollectionDialog open={addEventCollectionDialogOpen} setOpen={setAddEventCollectionDialogOpen} onSave={collectionData => addCollection(collectionData)} collection={null}/>

      </Paper>
    </div>
  )
}


export function EventCollections(props) {
  const [editToken, setEditToken] = useState('')
  const { tenant, token } = useParams();

  useEffect(() => {
    repository.onTokenChanged(tenant, token => {
      setEditToken(token);
    });
  }, [tenant]);

  if(token === editToken){
    return (
      <AdminEventCollections tenant={tenant}/>
    );
  }
  else {
    return (
      <ViewEventCollections tenant={tenant}/>
    );
  }
}
