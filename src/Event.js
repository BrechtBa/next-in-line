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


import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';


function EventDuration(props){
  const event = props.event;
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if(event.started && ! event.finished){
      const interval = setInterval(() => setDuration(event.getDuration()), 1000);
      return () => clearInterval(interval);
    }
  }, [event]);

  const formatDuration = duration => {
    const minutes = Math.floor(duration/1000/60)
    const seconds = Math.floor((duration - minutes*60*1000)/1000)

    return `${(minutes < 10) ? '0' + minutes : minutes}:${(seconds < 10) ? '0' + seconds : seconds}`;
  }

  return (
    <div>
      {(event.started) && (<div>{formatDuration(duration)}</div>)}
    </div>
  )
}


function EventContent(props) {
  const event = props.event;

  return (
    <div style={{display: 'flex', flexDirection: 'column', flexWrap: 'wrap'}}>
      <h1 style={{marginTop: 0}}>{event.title}</h1>
      <EventDuration event={event}/>
    </div>
  )
}



export function ViewEvent(props) {
  const event = props.event;

  return (
    <Paper style={{margin: '1em', padding: '0.5em'}}>
      <EventContent event={event} />
    </Paper>
  )

}

export function EditEventDialog(props) {
  const open = props.open;
  const setOpen = props.setOpen;
  const onSave = props.onSave;
  const event = props.event;

  const [eventData, setEventData] = useState({
    title: 'New Event',
    plannedStartDate: new Date(),
    plannedFinishDate: null,
    startDate: null,
    finishDate: null,
    started: false,
    finished: false
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
        finished: false
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
        finished: event.finished
      })
    }
  }, [event]);

  const handleSave = () => {
    setOpen(false);
    console.log(eventData)
    onSave(eventData);
  }

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <div style={{margin: '1em'}}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <h1>Edit Event</h1>
          <div>
            <Stack spacing={2}>
              <TextField value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} label="Title" />
              <DateTimePicker label='Planned Start' value={eventData.plannedStartDate} onChange={date => setEventData({...eventData, plannedStartDate: date})} renderInput={(params) => <TextField {...params} />} />
              <DateTimePicker label='Start' value={eventData.startDate} onChange={date => setEventData({...eventData, plannedStartDate: date})} renderInput={(params) => <TextField {...params} />} />

              <FormControlLabel control={<Switch checked={eventData.started} onChange={e => setEventData({...eventData, started: !eventData.started})}/>} label="Started" />
              <FormControlLabel control={<Switch checked={eventData.finished} onChange={e => setEventData({...eventData, finished: !eventData.finished})}/>} label="Finished" />
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


export function AdminEvent(props) {
  const event = props.event;
  const setEvent = props.setEvent;

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <Paper style={{margin: '1em', padding: '0.5em', position: 'relative'}}>
      <div style={{position: 'absolute', top: 0, right: 0}}>
        <IconButton aria-label="Example" onClick={()=>setEditDialogOpen(true)}>
          <CreateIcon />
        </IconButton>
      </div>

      <EventContent event={event} />

      <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
        <div>
          {(!event.started || event.finished) && <Button onClick={() => setEvent(event.start())}>Start</Button>}
          {(event.started && !event.finished) && <Button onClick={() => setEvent(event.finish())}>Finish</Button>}
        </div>
      </div>

      <EditEventDialog open={editDialogOpen} setOpen={setEditDialogOpen} onSave={eventData => setEvent(event.update(eventData))} event={event} />
    </Paper>
  )

}