import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { AuthProvider } from './AuthContext';
import Login from './Login';
import App from './App';
import History from './History';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

render(
  () => (
    <AuthProvider>
      <Router>
        <Route path="/" component={Login} />
        <Route path="/app" component={App} />
        <Route path="/history" component={History} />
      </Router>
    </AuthProvider>
  ),
  root,
);
