import React from 'react';
import { useRoutes, Navigate } from 'react-router-dom';

// Import Role Routes
import AdminRoutes from './admin-routes';
import StaffRoutes from './staff-routes';

// Public Pages
import Login from '../pages/authentication';

import { useAuth } from '@contexts/AuthContext';

const ThemeRoutes = () => {
  // ดึงข้อมูล Role จาก AuthContext
  const { role, token } = useAuth();

  // ตรวจสอบความถูกต้องของ Role
  const getRoutesByRole = () => {
    if (!token) return []; // ถ้าไม่มี Token ให้ใช้แค่ Public Routes
    
    switch (role) {
      case 'admin':
        return [AdminRoutes];
      case 'staff':
        return [StaffRoutes];
      default:
        return [];
    }
  };

  return useRoutes([
    {
      path: '/login',
      element: token ? <Navigate to="/" replace /> : <Login />
    },
    ...getRoutesByRole(),
    {
      path: '*',
      element: <Navigate to={token ? "/" : "/login"} replace />
    }
  ]);
};

export default ThemeRoutes;
