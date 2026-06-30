import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.jsx'

import { Amplify } from 'aws-amplify';
import { COGNITO } from './configuration';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: COGNITO.USER_POOL_ID,
      userPoolClientId: COGNITO.USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: COGNITO.DOMAIN,
          scopes: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [window.location.origin, 'http://localhost:5173/'],
          redirectSignOut: [window.location.origin, 'http://localhost:5173/'],
          responseType: 'code'
        }
      }
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
