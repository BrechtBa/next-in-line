import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import './style.css';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Event, EventData } from './Domain';
import { useCases } from './UseCases';


function EventDuration({event}: {event: Event}){
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if(event.started && ! event.finished){
      const interval = setInterval(() => setDuration(event.getDuration()), 1000);
      return () => clearInterval(interval);
    }
    if(event.finished){
      setDuration(event.getDuration());
    }
  }, [event]);

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration/1000/3600)
    const minutes = Math.floor((duration/1000 - hours*3600)/60)
    const seconds = Math.floor((duration/1000 - hours*3600 - minutes*60))

    const minutesSeconds = `${(minutes < 10) ? '0' + minutes : minutes}:${(seconds < 10) ? '0' + seconds : seconds}`;
    if(hours > 0){
      return hours + ':' + minutesSeconds;
    }
    return minutesSeconds;
  }

  return (
    <div>
      {(event.started) && (<div>{formatDuration(duration)}</div>)}
    </div>
  )
}

const formatDateTime = (date: Date | null) => {
  if(date === null){
    return (
      <div></div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
      <div style={{marginRight: '0.3em'}}>{date.toLocaleDateString("nl-BE")}</div>
      <div style={{marginRight: '0.3em'}}>{date.toLocaleTimeString("nl-BE", {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  );
}

export function EditEventDialog({open, setOpen, onSave, event}: {open: boolean, setOpen: (open: boolean) => void, onSave: (eventData: EventData) => void, event: Event | null}) {

  const [eventData, setEventData] = useState<EventData>({
    title: 'New Event',
    plannedStartDate: new Date(),
    plannedFinishDate: null,
    startDate: null,
    finishDate: null,
    started: false,
    finished: false,
    isFavorite: false,
  })

  useEffect(() => {
    if(event === null) {
      setEventData({
        title: 'New Event',
        plannedStartDate: new Date(),
        plannedFinishDate: null,
        startDate: null,
        finishDate: null,
        started: false,
        finished: false,
        isFavorite: false,
      })
    }
    else {
      setEventData({
        title: event.title,
        plannedStartDate: event.plannedStartDate,
        plannedFinishDate: event.plannedFinishDate,
        startDate: event.startDate,
        finishDate: event.finishDate,
        started: event.started,
        finished: event.finished,
        isFavorite: event.isFavorite,
      })
    }
  }, [event]);

  const handleSave = () => {
    setOpen(false);
    onSave(eventData);
  }

  return (
    <Dialog onClose={() => setOpen(false)} open={open}>
      <div style={{margin: '1em'}}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <h1>Edit Event</h1>
          <div>
            <Stack spacing={2}>
              <TextField value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} label="Title" />
              <DateTimePicker label='Planned Start' value={eventData.plannedStartDate} onChange={date => date !== null && setEventData({...eventData, plannedStartDate: new Date(date.setSeconds(0))})} ampm={false} />

              <FormControlLabel control={<Switch checked={eventData.started} onChange={() => setEventData({...eventData, started: !eventData.started})}/>} label="Started" />
              <FormControlLabel control={<Switch checked={eventData.finished} onChange={() => setEventData({...eventData, finished: !eventData.finished})}/>} label="Finished" />
            </Stack>
          </div>
          <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </LocalizationProvider>
      </div>
    </Dialog>
  )
}


export function EventComponent({dashboard, eventCollection, event, edit, setEvent, deleteEvent}: {dashboard: string, eventCollection: string, event: Event, edit: boolean, setEvent: (event: Event) => void, deleteEvent: (key: string) => void}) {

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [isFavorite, setEventIsFavorite] = useState(useCases.getEventIsFavorite(dashboard, eventCollection, event.key));


  const handleDelete = () => {
    setDeleteDialogOpen(false);
    deleteEvent(event.key);
    //useCases.deleteEvent(dashboard, eventCollection, event.key);
  }
  const handleFavorite = ()  => {
    useCases.setEventIsFavorite(dashboard, eventCollection, event, !event.isFavorite)
    // setEventIsFavorite(!isFavorite)
  }

  const getBackgroundColor = (event: Event) => {
    if(!event.started){
      return 'rgb(255, 255, 255)';
    }
    if (event.finished) {
      return 'rgb(235, 235, 235)';
    }
    if (event.started) {
      return 'rgba(25, 118, 210, 0.3)';
    }
    return 'rgb(255, 255, 255)';
  }

  return (
    <Paper className='paperEvent' style={{backgroundColor: getBackgroundColor(event)}}>
      <div style={{display: 'flex', flexDirection: 'row', gap: "1em"}}>


        <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between'}}>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
            <h1 style={{marginTop: 0}}>{event.title}</h1>
              {!edit && (
          
              <IconButton aria-label="Favorite" onClick={handleFavorite}>
                {event.isFavorite ? <FavoriteIcon sx={{ color: "red" }}/> :  <FavoriteBorderIcon />}
              </IconButton>
            )}
          </div>
          
          <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
            <div style={{flexGrow: 1}}>{formatDateTime(event.getStartDate())}</div>
            <div><EventDuration event={event}/></div>
          </div>
        </div>

        {edit && (
          <div style={{display: 'flex', flexDirection: "column", justifyContent: 'space-between'}}>
            <div>
              <IconButton aria-label="Example" onClick={()=>setEditDialogOpen(true)}>
                <CreateIcon />
              </IconButton>
              <IconButton aria-label="Example" onClick={()=>setDeleteDialogOpen(true)}>
                <DeleteIcon />
              </IconButton>
            </div>

            <div>
              {(!event.started || event.finished) && <Button onClick={() => setEvent(event.start())}>Start</Button>}
              {(event.started && !event.finished) && <Button onClick={() => setEvent(event.finish())}>Finish</Button>}
            </div>
          </div>
        )}

      </div>

      <EditEventDialog open={editDialogOpen} setOpen={setEditDialogOpen} onSave={eventData => setEvent(event.update(eventData))} event={event} />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <div style={{margin: '1em'}}>
          <h1>Delete event?</h1>
          <div style={{marginTop: '1em', display: 'flex', justifyContent: 'flex-end'}}>
            <Button onClick={handleDelete}>Delete</Button>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </Paper>
  )

}