import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">Copyright &copy; 2025</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">All rights reserved by</span>
        <a href="#" target="_blank" rel="noopener noreferrer">
          NashikPicklers
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
