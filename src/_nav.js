import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
  cilEqualizer,
  cilCog,
  cilList,
  cilCart,
  cilBabyCarriage,
  cilUserPlus,
  cilBasket,
  cilColorBorder,
  cilNotes,
  cilEnvelopeLetter,
  cilChatBubble,
  cilSettings,
  cilCalendar,
  cilClock,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/NashikPicklers',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'NashikPicklers',
  },
  {
    component: CNavItem,
    name: 'Courts',
    to: '/courts',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Time Slots',
    to: '/slots',
    icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Bookings',
    to: '/bookings',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'CheckIns',
    to: '/checkIns',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
  },
]

export default _nav
