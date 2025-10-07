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
    name: 'PicklePlay Dashboard',
    to: '/pickleplay',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'PicklePlay',
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
]

export default _nav
