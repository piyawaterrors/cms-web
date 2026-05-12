import React from 'react';
import { Navigate } from 'react-router-dom';

// Layout
import MainLayout from '../layout/MainLayout';

// Pages
import Dashboard from '../pages/dashboard';
import Plots from '../pages/plots';
import Deceased from '../pages/deceased';

const StaffRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />
    },
    {
      path: 'dashboard',
      element: <Dashboard />
    },
    {
      path: 'plots',
      element: <Plots />
    },
    {
      path: 'deceased',
      element: <Deceased />
    }
  ]
};

export default StaffRoutes;
