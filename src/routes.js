import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/dashboard'))
// NashikPicklers Components
const Courts = React.lazy(() => import('./views/dashboard/Courts'))
const Slots = React.lazy(() => import('./views/dashboard/Slots'))
const Bookings = React.lazy(() => import('./views/dashboard/Bookings'))
const CheckedIns = React.lazy(() => import('./views/dashboard/CheckedIns'))
const Reports = React.lazy(() => import('./views/dashboard/Reports'))
const NashikPicklersDashboard = React.lazy(() => import('./views/dashboard/NashikPicklersDashboard'))

const Settings = React.lazy(() => import('./views/forms/settings/UpdatePassword'))

const Validation = React.lazy(() => import('./views/forms/validation/Validation'))
const ViewSellerRegistration = React.lazy(
  () => import('./views/forms/view-seller-registration/ViewSellerRegistration'),
)

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/NashikPicklers', name: 'NashikPicklers Dashboard', element: NashikPicklersDashboard },
  { path: '/courts', name: 'Courts', element: Courts },
  { path: '/slots', name: 'Time Slots', element: Slots },
  { path: '/bookings', name: 'Bookings', element: Bookings },
  { path: '/checkIns', name: 'CheckedIns', element: CheckedIns },
  { path: '/reports', name: 'Reports', element: Reports },
  { path: '/settings', name: 'Settings', element: Settings },
  {
    path: '/forms/view-seller-registration/:id',
    name: 'Registered Seller Details',
    element: ViewSellerRegistration,
  },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
