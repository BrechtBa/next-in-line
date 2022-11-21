import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";

import './style.css';

import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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

  return (
    <Dialog onClose={() => setOpen(false)} open={open}>
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
  const dashboard = props.dashboard;
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
    repository.setEventCollection(dashboard, newCollection);
    setEventCollection(newCollection);
  }
  const deleteEvent = (key) => {
    repository.deleteEvent(dashboard, eventCollection, key);
  }

  const addEvent = (eventData) => {
    repository.addEvent(dashboard, eventCollection, eventData);
  }

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    repository.deleteEventCollection(dashboard, eventCollection.key);
  }
  const duplicateCollection = () => {
    repository.duplicateEventCollection(dashboard, eventCollection.key);
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
              <IconButton aria-label="Example" onClick={()=>duplicateCollection()}>
                <ContentCopyIcon />
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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


export function ViewEventCollections(props) {

  const { dashboard, token } = useParams();
  const navigate = useNavigate();

  const [edit, setEdit] = useState(false);
  const [eventCollections, setEventCollections] = useState([])
  const [addEventCollectionDialogOpen, setAddEventCollectionDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTokenInput, setEditTokenInput] = useState('');

  useEffect(() => {
    repository.onEventCollectionsChanged(dashboard, collections => {
      setEventCollections(collections);
    }, () => {
      navigate('/');
    });
  }, [dashboard, navigate]);

  useEffect(() => {
    if(token !== undefined){
      repository.editAllowed(dashboard, token, () => {
        setEdit(true);
      }, (error) => {
        setEdit(false);
        console.error(error)
      });
    }
    else{
      setEdit(false);
    }
  }, [dashboard, token]);

  const setEventCollection = (collection) => {
    repository.setEventCollection(dashboard, collection);
  }

  const addCollection = (collectionData) => {
    repository.addEventCollection(dashboard, collectionData)
  };

  const closeAndNavigate = () => {
    setEditDialogOpen(false);
    const editToken = editTokenInput;
    setEditTokenInput('');
    navigate(`/${dashboard}/${editToken}`);
  }

  return (
    <div>

      <div style={{display: 'flex', flexDirection: 'row', wrap: 'wrap'}}>
        {eventCollections.filter(c => (edit || (c.getEvents(edit).length > 0))).map(collection => (
          <EventCollectionComponent key={collection.key} dashboard={dashboard} eventCollection={collection} setEventCollection={setEventCollection} edit={edit}/>
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


      <div style={{display: 'flex',  flexDirection: 'row'}}>
        { edit && (
          <div style={{display: 'flex', margin: '2em'}}>
            <Button onClick={() => setDetailsDialogOpen(true)} variant="outlined">Show dashboard details</Button>

            <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)}>
              <div style={{margin: '1em'}}>
                <h1>Dashboard details</h1>
                <div>Dashboard key: {dashboard}</div>
                <div>Dashboard admin token: {token}</div>
                <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
                  <Button onClick={() => setDetailsDialogOpen(false)}>close</Button>
                </div>
              </div>
            </Dialog>

          </div>
        )}

        { !edit && (
          <div style={{display: 'flex', margin: '2em'}}>
            <Button onClick={() => setEditDialogOpen(true)} variant="outlined">Edit dashboard</Button>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
              <div style={{margin: '1em'}}>
                <h1>Edit Dashboard</h1>

                <TextField value={editTokenInput} onChange={e => setEditTokenInput(e.target.value)} onKeyPress={(e) => (e.key === 'Enter') &&  closeAndNavigate()} label="Dashboard edit token" />

                <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
                  <Button onClick={() => closeAndNavigate()}>Open</Button>
                  <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                </div>
              </div>
            </Dialog>
          </div>
        )}

        { edit && (
          <div style={{display: 'flex', margin: '2em'}}>
            <Button onClick={() => navigate(`/${dashboard}`)} variant="outlined">View dashboard</Button>
          </div>
        )}

        <div style={{display: 'flex', margin: '2em'}}>
          <Button onClick={() => navigate('/')} variant="outlined">Home</Button>
        </div>
      </div>

    </div>
  );
}
