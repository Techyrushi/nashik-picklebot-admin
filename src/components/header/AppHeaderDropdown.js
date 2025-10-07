import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilSettings,
  cilLockLocked,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import { useNavigate } from 'react-router-dom' // For redirection
import avatar8 from './../../assets/images/avatars/8.png'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear token from local storage
    localStorage.removeItem('token')

    // Redirect to login page
    navigate('/login')
  }

  const handleSettings = () => {
    // Redirect to the settings page
    navigate('/settings')
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
        {/* <CDropdownItem onClick={handleSettings} style={{ cursor: "pointer" }}>
          <CIcon icon={cilSettings} className="me-2"/>
          Settings
        </CDropdownItem> */}
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout} style={{ cursor: "pointer", background: "transparent", hover: { background: "transparent", color: "black" } }}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Log Out
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
