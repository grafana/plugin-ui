import './App.css';
import { Button, IconButton, ListItemSecondaryAction, FormControlLabel, Checkbox } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import React from 'react';
import FormControl from '@material-ui/core/FormControl';
// import { Button } from '@grafana/ui';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import Drawer from '@material-ui/core/Drawer';
import { Type, types } from './types';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';
import AddIcon from '@material-ui/icons/Add';

function App() {

  interface State {
    name?: string
    items: Type[]
    open: boolean
    selected?: Type
    active?: Type
    json?: any
  }

  const defaultState: State = {
    open: false,
    items: [],
    json: []
  }
  const [state, setState] = React.useState(defaultState);

  const handleSelectComponent = (event: any) => {
    const name = event.target.value;
    const selected = types.find((t: Type) => t.name === name);
    setState({
      ...state,
      name: event.target.value,
      selected
    });
  };

  const handleAdd = (event: any) => {
    const selected: Type = {
      key: String(new Date().getTime()),
      name: state.selected!.name,
      props: state.selected!.props
    }

    const item: any = {};
    for (const p of selected.props) {
      if (!['options', 'showIf', 'secure'].includes(p)) {
        item[p] = "";
      }
      if (p === 'options' || p === 'showIf') {
        item[p] = [];
      }
      if (p === 'secure') {
        item[p] = false;
      }
    }
    const json = [...state.json, item];

    setState({
      ...state,
      items: [...state.items, selected],
      json
    });
  }

  const show = (item: Type) => {
    if (item.key === state.active?.key) {
      setState({
        ...state,
        open: false,
        active: undefined
      });
      return;
    }
    setState({
      ...state,
      open: true,
      active: item
    });
  }

  const remove = (item: Type) => {
    const items = state.items.filter(i => i.key !== item.key)
    const json = state.json.filter((i: any) => i.key !== item.values?.key);
    setState({
      ...state,
      items,
      json,
      open: false
    });
  }

  const onPropChange = (event: any) => (prop: string) => {
    const val = event.target.value;
    const active = state.active!;
    const values = {...active?.values, [prop]: val}

    const item = state.items.find(i => i.key === active.key);
    if (item) {
      item.values = values;
    }

    const json = state.items.map(i => {
      return {...i.values, options: i.options}
    });

    setState({
      ...state,
      active: {...active, values},
      json
    });
  }

  const addOption = () => {
    const item = state.active!;
    const options = item?.options || [];
    const update = [...options, {value: '', label: ''}]
    setState({
      ...state,
      active: {...item, options: update},
    });
  }

  const onOptionChange = (e: any) => (prop: string, index: number) => {
    const value = e.target.value;
    const active = state.active!;
    const options = active?.options || [];
    const opt = options[index];
    const update = {...opt, [prop]: value};
    const listUpdate = options.map((o,i) => {
      if (i === index) {
        return update;
      }
      return o;
    });

    const item = state.items.find(i => i.key === active.key);
    if (item) {
      item.options = listUpdate;
    }

    const json = state.items.map(i => {
      const values = i.values;
      return {...values, options: i.options}
    });

    setState({
      ...state,
      active: {...active, options: listUpdate},
      json
    });
  }

  const addShowIf = () => {
    const item = state.active!;
    const showIf = item?.showIf || [];
    const update = [...showIf, {key: '', oper: '=', value: ''}]
    setState({
      ...state,
      active: {...item, showIf: update},
    });
  }

  const onShowIfChange = (e: any) => (prop: string, index: number) => {
    const value = e.target.value;
    const active = state.active!;
    const showIf = active?.showIf || [];
    const opt = showIf[index];
    const update = {...opt, [prop]: value};
    const listUpdate = showIf.map((o,i) => {
      if (i === index) {
        return update;
      }
      return o;
    });

    const item = state.items.find(i => i.key === active.key);
    if (item) {
      item.showIf = listUpdate;
    }

    const json = state.items.map(i => {
      const values = i.values;
      return {...values, showIf: i.showIf}
    });

    setState({
      ...state,
      active: {...active, showIf: listUpdate},
      json
    });
  }

  const handleCheckChange = (event: any) => {
    // TODO: this is almost the same as onPropChange
    const val = event.target.checked;
    const active = state.active!;
    const values = {...active?.values, secure: val}

    const item = state.items.find(i => i.key === active.key);
    if (item) {
      item.values = values;
    }

    const json = state.items.map(i => {
      return {...i.values, options: i.options}
    });

    setState({
      ...state,
      active: {...active, values},
      json
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <FormControl variant="outlined">
          <Select
              className="component-select"
              native
              value={state.name}
              onChange={handleSelectComponent}
              inputProps={{
                name: 'name',
                id: 'name-native-simple',
              }}
            >
            <option aria-label="None" value="" />
            {types.map((t: Type) => {
              return <option value={t.name} key={t.name}>{t.name}</option>
            })}
          </Select>
        </FormControl>
        <Button color="primary" variant="contained" className="add-button" onClick={handleAdd}>Add</Button>
      </header>
      <div className="container">
        <div className="types left">
          <List component="nav" aria-label="secondary mailbox folders">
            {state.items.map(item => {
              return (
                <ListItem button onClick={() => show(item)} key={item.key}>
                  <ListItemText primary={item.name} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => remove(item)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              )
            })}
          </List>
        </div>
        <div className="half">
        {/* <TextField
          id="standard-textarea"
          multiline
          variant="outlined"
        /> */}
        <JSONPretty mainStyle="padding:1em" id="json-pretty" data={state.json}></JSONPretty>
        </div>
      </div>
      <Drawer
        // className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={state.open}
        // classes={{
        //   paper: classes.drawerPaper,
        // }}
      >
        <header className="App-header">
          Settings
        </header>
        <form noValidate autoComplete="off">
          {state.active && state.active!.props.map(prop => {
            const values = state.active!.values || {};
            let value;
            let className = '';
            if (prop === "secure") {
              value = values[prop] || false;
              className = 'check';
            } else {
              value = values[prop] || "";
            }
            const options = state.active!.options || [];
            const showIf = state.active!.showIf || [];
            return (
            <div key={prop} className={className}>
              {!['options','showIf','secure'].includes(prop)  &&
                <TextField
                  id={prop}
                  label={prop}
                  variant="outlined"
                  value={value}
                  size="small"
                  fullWidth
                  onChange={(e) => onPropChange(e)(prop)}
                />
              }
              {prop === 'secure' && 
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value}
                      onChange={handleCheckChange}
                      name="secure"
                      color="primary"
                    />
                  }
                label="Secure"
              />
              }
              {/* SHOW IF */}
              {prop === 'showIf' &&
                <>
                  <div className="options-header">
                    <span>Show If</span>
                    <IconButton aria-label="add" onClick={addShowIf}>
                      <AddIcon />
                    </IconButton>
                  </div>
                  
                  {showIf.map((o,i) => {
                    return (
                      <div key={i}>
                        <TextField
                          placeholder="key"
                          onChange={(e) => onShowIfChange(e)('key', i)}
                        />
                        <Select onChange={(e) => onShowIfChange(e)('oper', i)} defaultValue="=">
                          <option aria-label="eq" value="=">=</option>
                          <option aria-label="in" value="in">in</option>
                          <option aria-label="not in" value="!in">!in</option>
                        </Select>
                        <TextField
                          placeholder="value"
                          onChange={(e) => onShowIfChange(e)('value', i)}
                        />
                      </div>
                    )
                  })}
                </>
              }

              {prop === 'options' &&
                <>
                  <div className="options-header">
                    <span>Options</span>
                    <IconButton aria-label="add" onClick={addOption}>
                      <AddIcon />
                    </IconButton>
                  </div>
                  
                  {options.map((o,i) => {
                    return (
                      <div key={i}>
                        <TextField
                          placeholder="value"
                          onChange={(e) => onOptionChange(e)('value', i)}
                        />
                        <TextField
                          placeholder="label"
                          onChange={(e) => onOptionChange(e)('label', i)}
                        />
                      </div>
                    )
                  })}
                </>
              }
            </div>
            )
          })}
        </form>
      </Drawer>
    </div>
  );
}

export default App;
