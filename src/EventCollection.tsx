import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from "react-router";

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

import { FileDrop } from 'react-file-drop'

import { EventComponent, EditEventDialog } from './Event.js'

import { EventCollection, type EventCollectionData, type EventData } from './Domain.js'
import { CouldNotParseError, ImportError, InvalidInputError, useCases } from './UseCases.js';



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


function EventCollectionComponent({dashboard, eventCollection, edit, setEventCollection}: {dashboard:string, eventCollection: EventCollection, edit: boolean, setEventCollection: (collection: EventCollection) => void}) {

  const [collapsed, setCollapsed] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const setEvent = (event) => {
    setEventCollection(useCases.setEvent(dashboard, eventCollection, event));
  }
  const deleteEvent = (key: string) => {
    useCases.deleteEvent(dashboard, eventCollection.key, key);
  }

  const addEvent = (eventData: EventData) => {
    useCases.addEvent(dashboard, eventCollection.key, eventData);
  }

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    useCases.deleteEventCollection(dashboard, eventCollection.key);
  }
  const duplicateCollection = () => {
    useCases.duplicateEventCollection(dashboard, eventCollection.key);
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
                <EventComponent key={event.key}  dashboard={dashboard} eventCollection={eventCollection.key} event={event} setEvent={setEvent} deleteEvent={deleteEvent} edit={edit}/>
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


export function ViewEventCollections() {

  const { dashboard, token } = useParams();
  const navigate = useNavigate();

  const [edit, setEdit] = useState(false);
  const [eventCollections, setEventCollections] = useState([])
  const [addEventCollectionDialogOpen, setAddEventCollectionDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState('');
  const [editTokenInput, setEditTokenInput] = useState('');

  useEffect(() => {

    useCases.onEventCollectionsChanged(dashboard, collections => {
      setEventCollections(collections);
    }, () => {
      navigate('/');
    });
  }, [dashboard, navigate]);

  useEffect(() => {
    if(token !== undefined){
      useCases.editAllowed(dashboard, token, () => {
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

  const setEventCollection = (collection: EventCollection) => {
    useCases.setEventCollection(dashboard, collection);
  }

  const addCollection = (collectionData: EventCollectionData) => {
    useCases.addEventCollection(dashboard, collectionData)
  };

  const closeAndNavigate = () => {
    setEditDialogOpen(false);
    const editToken = editTokenInput;
    setEditTokenInput('');
    navigate(`/${dashboard}/${editToken}`);
  }

  const exportCollections = () => {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(eventCollections, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "next-in-line-export.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const fileInputRef = useRef(null);

  const onFileInputChange = (files) => {
    var reader = new FileReader();
    reader.readAsText(files[0], "UTF-8");
    reader.onload = function (evt) {
      try {
        useCases.importEventCollections(dashboard, evt.target.result as string);
        setImportDialogOpen(false);
      }  
      catch (e) {
        console.log(e instanceof InvalidInputError)
        if (e instanceof ImportError) {
          setImportErrorMessage("Error during importing!");
        }
        else if (e instanceof CouldNotParseError) {
          setImportErrorMessage("Error during importing!");
        }
        else if (e instanceof InvalidInputError) {
          setImportErrorMessage("File could not be read!");
        }
        else {
          throw e;
        }
      }
    }
    reader.onerror = function () {
        console.log("error reading file");
    }

  }

  return (
    <div>

      <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
        {eventCollections.filter(c => (edit || (c.getEvents(edit).length > 0))).map(collection => (
          <EventCollectionComponent key={collection.key} dashboard={dashboard} eventCollection={collection} setEventCollection={setEventCollection} edit={edit}/>
        ))}

        {edit && (
          <Paper style={{margin: '0.5em', padding: '0.2em', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center',
                                       borderStyle: 'dashed', borderColor: '#f0f0f0'}}>
            <Fab color="primary" aria-label="add" onClick={() => setAddEventCollectionDialogOpen(true)}>
              <AddIcon />
            </Fab>
            
            <EditCollectionDialog open={addEventCollectionDialogOpen} setOpen={setAddEventCollectionDialogOpen} onSave={(collectionData: EventCollectionData) => addCollection(collectionData)} collection={null}/>
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
        { edit && (
          <div style={{display: 'flex', margin: '2em'}}>
            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
              <div style={{margin: '1em'}}>
                <h1>Importing will delete all data</h1>
                <div style={{color: "#f00"}}>{importErrorMessage}</div>
                <FileDrop onDrop={(files) => onFileInputChange(files)} onTargetClick={() => fileInputRef.current.click()}>
                  <div style={{width: "20em", height: "10em", backgroundColor: '#f0f0f0', border: "1px dashed #aaa", display: "flex", justifyContent: "center", alignItems: "center"}}>
                    Drop a .json file here.
                  </div>
                </FileDrop>
                <input onChange={(e) => onFileInputChange(e.target.files)} ref={fileInputRef} type="file" style={{display: "none"}}/>
                <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
                  <Button onClick={() => setImportDialogOpen(false)}>close</Button>
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
            <Link to={`/${dashboard}`} target="_blank" rel="noopener noreferrer"><Button variant="outlined">View dashboard</Button></Link>
          </div>
        )}

        { edit && (
          <div style={{display: 'flex', margin: '2em'}}>
            <Button onClick={() => exportCollections()} variant="outlined">Export</Button>
          </div>
        )}

        { edit && (
          <div style={{display: 'flex', margin: '2em'}}>
            <Button onClick={() => {setImportErrorMessage(""); setImportDialogOpen(true)}} variant="outlined">Import</Button>
          </div>
        )}

        <div style={{display: 'flex', margin: '2em'}}>
          <Link to="/"><Button variant="outlined">Home</Button></Link>
        </div>
      </div>

    </div>
  );
}
