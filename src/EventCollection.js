import { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import './style.css';

import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';

import { EventComponent, EditEventDialog } from './Event.js'

import { EventCollection } from './Domain.js'
import { getRepository } from './repository/firebase.js'


const repository = getRepository();


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


function EventCollectionComponent(props) {
  const tenant = props.tenant;
  const eventCollection = props.eventCollection;
  const edit = props.edit || false;
  const setEventCollection = props.setEventCollection;

  const [collapsed, setCollapsed] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
  const deleteEvent = (key) => {
    repository.deleteEvent(tenant, eventCollection, key);
  }

  const addEvent = (eventData) => {
    repository.addEvent(tenant, eventCollection, eventData);
  }

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    repository.deleteEventCollection(tenant, eventCollection.key);
  }

  return (
    <Paper className='paperEventCollection' style={{flexGrow: collapsed ? 0 : 1, minWidth: collapsed ? '2em' : '8em'}} >
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>

          <div style={{display: 'flex', flexDirection: 'row', flexGrow: 1}}>
            {collapsed ? (
            <IconButton aria-label="Example" onClick={()=>setCollapsed(false)}>
              <ExpandMoreIcon />
            </IconButton>
           ) : (
             <IconButton aria-label="Example" onClick={()=>setCollapsed(true)}>
              <ExpandLessIcon />
            </IconButton>
           )}
          </div>

          {(edit && !collapsed) && (
            <div style={{display: 'flex', flexDirection: 'row'}}>
              <IconButton aria-label="Example" onClick={()=>setEditDialogOpen(true)}>
                <CreateIcon />
              </IconButton>
              <IconButton aria-label="Example" onClick={()=>setDeleteDialogOpen(true)}>
                <DeleteIcon />
              </IconButton>
            </div>
          )}
        </div>

        {!collapsed && (
          <div>
            <h1 style={{marginLeft: '1em', marginTop: 0}}>{eventCollection.title}</h1>

            <div>
              {eventCollection.getEvents(true).map(event => (
                <EventComponent key={event.key} event={event} setEvent={setEvent} deleteEvent={deleteEvent} edit={edit}/>
              ))}
            </div>

            {edit && (
              <div style={{textAlign: 'center'}}>
                <Fab color="primary" aria-label="add" onClick={() => setAddEventDialogOpen(true)}>
                  <AddIcon />
                </Fab>
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <h1 style={{writingMode: 'vertical-rl', textOrientation: 'mixed', height: '400px', marginRight: 0}}>{eventCollection.title}</h1>
        )}

      </div>

      <EditEventDialog open={addEventDialogOpen} setOpen={setAddEventDialogOpen} onSave={eventData => addEvent(eventData)} event={null} />
      <EditCollectionDialog open={editDialogOpen} setOpen={setEditDialogOpen} onSave={collectionData => setEventCollection(eventCollection.update(collectionData))} collection={eventCollection}/>

      <Dialog open={deleteDialogOpen} handleClose={() => setDeleteDialogOpen(false)}>
        <div style={{margin: '1em'}}>
          <h1>Delete collection?</h1>
          <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
            <Button onClick={handleDelete}>Delete</Button>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </Paper>
  );
}


export function EventCollections(props) {

  const { tenant, token } = useParams();

  const [editToken, setEditToken] = useState('');
  const [eventCollections, setEventCollections] = useState([])
  const [addEventCollectionDialogOpen, setAddEventCollectionDialogOpen] = useState(false);

  useEffect(() => {
    repository.onEventCollectionsChanged(tenant, collections => {
      setEventCollections(collections);
    });
  }, [tenant]);

  useEffect(() => {
    repository.onTokenChanged(tenant, token => {
      setEditToken(token);
    });
  }, [tenant]);

  const edit = token === editToken;

  const setEventCollection = (collection) => {
    repository.setEventCollection(tenant, collection);
  }

  const addCollection = (collectionData) => {
    repository.addEventCollection(tenant, collectionData)
  };

  return (
    <div>

      <div style={{display: 'flex', flexDirection: 'row', wrap: 'wrap'}}>
        {eventCollections.filter(c => (edit || (c.getEvents(edit).length > 0))).map(collection => (
          <EventCollectionComponent key={collection.key} tenant={tenant} eventCollection={collection} setEventCollection={setEventCollection} edit={edit}/>
        ))}

        {edit && (
          <Paper style={{margin: '0.5em', padding: '0.2em', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center',
                                       borderStyle: 'dashed', borderColor: '#f0f0f0'}}>
            <Fab color="primary" aria-label="add" onClick={() => setAddEventCollectionDialogOpen(true)}>
              <AddIcon />
            </Fab>
            <EditCollectionDialog open={addEventCollectionDialogOpen} setOpen={setAddEventCollectionDialogOpen} onSave={collectionData => addCollection(collectionData)} collection={null}/>
          </Paper>
        )}
      </div>

      { edit && (
        <div style={{margin: '2em'}}>
          <Link to='/'>New</Link>
        </div>
      )}
    </div>
  );
}
