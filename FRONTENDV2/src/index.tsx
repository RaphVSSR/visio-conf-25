import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SessionContext } from './contexts/SessionContext';
import { UserAuth } from './routing/UserAuth';
import { AdminPanel, Home, Login, Signup } from 'pages';


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionContext value={{currentUser: true, theme: 'light'}}>
      <BrowserRouter>

        <Routes>

          <Route path="/" element={ <UserAuth/> }/>
          <Route path="/home" element={ <Home /> }/>
          <Route path="/login" element={ <Login /> }/>
          <Route path='/signup' element={ <Signup /> } />
        <Route path='/admin' element={ <AdminPanel /> } />

        </Routes>

      </BrowserRouter>
    </SessionContext>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
