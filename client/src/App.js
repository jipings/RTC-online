import React, { Component } from 'react';
import { BrowserRouter,HashRouter, Route, Switch} from 'react-router-dom'

import FileShare from './views/fileshare';
import Socket from './views/socket';

class App extends Component {
  render() {
    return (
      <div className="App">
      <HashRouter>
        <Switch>
          <Route exact path="/connection/fileshare/:roomId" render={(props) => <FileShare {...props} />} />
          <Route exact path="/connection/socket" render={props => <Socket {...props} />} />
        </Switch>
      </HashRouter>
      </div>
    );
  }
}

export default App;
