import React from "react";
import { Navigate } from "react-router-dom";

// Layout
import MainLayout from "../layout/MainLayout";

// Pages
import Dashboard from "../pages/dashboard";
import Members from "../pages/members";
import Plots from "../pages/plots";
import PlotDetail from "../pages/plots/detail";
import Deceased from "../pages/deceased";
import Donations from "../pages/donations";
import Staff from "../pages/staff";
import SocietySettings from "../pages/settings";

const AdminRoutes = {
  path: "/",
  element: <MainLayout />,
  children: [
    {
      path: "/",
      element: <Navigate to="/dashboard" replace />,
    },
    {
      path: "dashboard",
      element: <Dashboard />,
    },
    {
      path: "members",
      element: <Members />,
    },
    {
      path: "plots",
      element: <Plots />,
    },
    {
      path: "plots/detail/:id",
      element: <PlotDetail />,
    },
    {
      path: "deceased",
      element: <Deceased />,
    },
    {
      path: "donations",
      element: <Donations />,
    },
    {
      path: "staff",
      element: <Staff />,
    },
    {
      path: "settings",
      element: <SocietySettings />,
    },
  ],
};

export default AdminRoutes;
