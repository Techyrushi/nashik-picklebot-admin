import React, { useState, useEffect } from 'react'
import axios from 'axios'
import axiosInstance from '@/config/axiosInstance'
import Swal from 'sweetalert2'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CFormInput,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import { APIURL, isSessionExpired } from '@/config/const'
import { useNavigate } from 'react-router-dom'
import editIcon from '/public/edit.png'
import removedIcon from '/public/removed.png'
import save from '/public/save.png'
import Preloader from 'src/components/Preloader.js' // Import the Preloader component

const Pincode = () => {
  const [files, setFiles] = useState([])
  const [deliveryZones, setDeliveryZones] = useState([])
  const [selectedZone, setSelectedZone] = useState('')
  const [pincodes, setPincodes] = useState([])
  const [error, setError] = useState('')
  const [editPincode, setEditPincode] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [loading, setLoading] = useState(true) // Add loading state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(10)
  const navigate = useNavigate()

  // Calculate pagination values
  const lastIndex = currentPage * recordsPerPage
  const firstIndex = lastIndex - recordsPerPage
  const currentPincodes = pincodes.slice(firstIndex, lastIndex)
  const totalPages = Math.ceil(pincodes.length / recordsPerPage)

  // Fetch delivery zones and pincodes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const zonesResponse = await axios.get(`${APIURL}delivery-zones`)
        const pincodesResponse = await axios.get(`${APIURL}pincodes`)
        setDeliveryZones(zonesResponse.data)
        setPincodes(pincodesResponse.data)
      } catch (error) {
        setError('Error fetching data')
        Swal.fire('Error', 'Failed to fetch data', 'error').then(() => {
          window.location.reload() // Refresh the page after successful update
        })
      } finally {
        // Set a timeout to ensure the preloader is shown for at least 2 seconds
        setTimeout(() => {
          setLoading(false)
        }, 2000)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Check if session expired
    if (isSessionExpired()) {
      // Show SweetAlert if the session has expired
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        icon: 'error',
        confirmButtonText: 'Login',
      }).then(() => {
        navigate('/login') // Redirect to login page
      })
    }
  }, [navigate])

  // Generate page numbers array
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    return pageNumbers
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleZoneChange = (e) => {
    setSelectedZone(e.target.value)
  }

  const handleDownloadCSV = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`${APIURL}pincodes/download/pincode_template`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'pincode_template.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      Swal.fire({
        title: 'Success',
        text: 'Pincode CSV template downloaded successfully.',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).then(() => {
        window.location.reload(); // Refresh the page after alert closes
      });      
    } catch (error) {
      console.error('Error downloading CSV template:', error)
      Swal.fire('Error', 'Failed to download the CSV template.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      Swal.fire('Error', 'Please upload at least one CSV file', 'error')
      return
    }

    if (!selectedZone) {
      Swal.fire('Error', 'Please select a delivery zone', 'error')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('zone_id', selectedZone)

    try {
      await axiosInstance.post(`${APIURL}pincodes/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      Swal.fire({
        title: 'Success',
        text: 'Pincode Details uploaded successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        window.location.reload()
      })
      setFiles([])
    } catch (error) {
      Swal.fire('Error', 'Upload the Correct Downloaded CSV Template.', 'error').then(() => {
        window.location.reload() // Refresh the page after successful update
      })
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this pincode?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`${APIURL}pincodes/${id}`)
        setPincodes(pincodes.filter((p) => p._id !== id))

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Pincode deleted successfully',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didClose: () => {
            window.location.reload(); // Refresh the page after toast closes
          }
        });
        
      } catch (error) {
        Swal.fire('Error', 'Failed to delete pincode', 'error').then(() => {
          window.location.reload() // Refresh the page after successful update
        })
      }
    }
  }

  const handleEdit = (id) => {
    navigate(`/forms/pincode/${id}`)
  }

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditSubmit = async () => {
    try {
      await axiosInstance.patch(`${APIURL}pincodes/${editPincode}`, editValues)
      setPincodes(pincodes.map((p) => (p._id === editPincode ? { ...p, ...editValues } : p)))
      setEditPincode(null)

      Swal.fire({
        title: 'Success',
        text: 'Pincode updated successfully',
        icon: 'success',
        timer: 2000, // Closes after 2 seconds
        timerProgressBar: true,
        showConfirmButton: false
      }).then(() => {
        window.location.reload() // Refresh the page after successful update
      });
      
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update pincode',
        icon: 'error',
        timer: 2000, // Closes after 2 seconds
        timerProgressBar: true,
        showConfirmButton: false
      }).then(() => {
        window.location.reload() // Refresh the page after successful update
      });
    }
  }

  const cancelEdit = () => {
    setEditPincode(null)
    setEditValues({})
  }

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const paginationItemStyle = {
    cursor: 'pointer',
    ':hover': {
      cursor: 'pointer'
    }
  }

  return (
    <>
      {/* Show Preloader if loading */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <Preloader />
        </div>
      ) : (
        <CRow>
          <CCol>
            <CCard className="mb-4">
              <CCardHeader className="text-center bg-primary text-white">
                <h5 className="mb-0">
                  <b>Upload Pincode CSV</b>
                </h5>
              </CCardHeader>
              <CCardBody>
                <CRow className="mb-3 align-items-center">
                  <CCol xs="12" md="6" className="mb-3 mb-md-0">
                    <div>
                      <label className="form-label">Select Delivery Zone:</label>
                      <select
                        value={selectedZone}
                        onChange={handleZoneChange}
                        className="form-select"
                      >
                        <option value="">Select Zone</option>
                        {deliveryZones.map((zone) => (
                          <option key={zone._id} value={zone._id}>
                            {zone.zone_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CCol>
                  <CCol xs="12" md="6">
                    <div>
                      <label className="form-label">Upload CSV Files:</label>
                      <input
                        type="file"
                        accept=".csv"
                        multiple
                        onChange={handleFileChange}
                        className="form-control"
                      />
                    </div>
                  </CCol>
                </CRow>
                <div className="d-flex gap-2">
                  <CButton color="primary" onClick={handleSubmit}>
                    Upload CSV
                  </CButton>
                  <CButton color="warning" onClick={handleDownloadCSV}>
                    Download CSV Template
                  </CButton>
                </div>
              </CCardBody>
            </CCard>

            <CCard>
              <CCardHeader className="text-center bg-primary text-white">
                <h5 className="mb-0">
                  <b>Pincode List</b>
                </h5>
              </CCardHeader>
              <CCardBody>
                {currentPincodes.length === 0 ? (
                  <CTable hover responsive bordered className="mb-2">
                    <CTableBody>
                      <CTableRow>
                        <CTableDataCell
                          colSpan={6}
                          style={{
                            textAlign: 'center',
                            padding: '16px',
                            fontWeight: 'bold',
                            color: 'red',
                          }}
                        >
                          No Pincodes Details Found
                        </CTableDataCell>
                      </CTableRow>
                    </CTableBody>
                  </CTable>
                ) : (
                  <>
                    <CTable hover responsive bordered className="mb-3">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell className="text-center">#</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Pincode</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">City</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">District</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">State</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {currentPincodes.map((pincode, index) => (
                          <CTableRow key={pincode._id}>
                            <CTableDataCell className="text-center">
                              {firstIndex + index + 1}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {editPincode === pincode._id ? (
                                <CFormInput
                                  value={editValues.pincode || pincode.pincode}
                                  onChange={(e) => handleEditChange('pincode', e.target.value)}
                                />
                              ) : (
                                pincode.pincode
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {editPincode === pincode._id ? (
                                <CFormInput
                                  value={editValues.city || pincode.city}
                                  onChange={(e) => handleEditChange('city', e.target.value)}
                                />
                              ) : (
                                pincode.city
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {editPincode === pincode._id ? (
                                <CFormInput
                                  value={editValues.district || pincode.district}
                                  onChange={(e) => handleEditChange('district', e.target.value)}
                                />
                              ) : (
                                pincode.district
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {editPincode === pincode._id ? (
                                <CFormInput
                                  value={editValues.state || pincode.state}
                                  onChange={(e) => handleEditChange('state', e.target.value)}
                                />
                              ) : (
                                pincode.state
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {editPincode === pincode._id ? (
                                <div className="d-flex justify-content-center gap-2">
                                  <CButton color="success" onClick={handleEditSubmit}>
                                    <img src={save} alt="Save" style={{ width: '20px' }} />
                                  </CButton>
                                  <CButton color="secondary" onClick={cancelEdit}>
                                    <img src={removedIcon} alt="Cancel" style={{ width: '20px' }} />
                                  </CButton>
                                </div>
                              ) : (
                                <div className="d-flex justify-content-center gap-2">
                                  <CButton color="warning" onClick={() => handleEdit(pincode._id)}>
                                    <img src={editIcon} alt="Edit" style={{ width: '20px' }} />
                                  </CButton>
                                  <CButton color="danger" onClick={() => handleDelete(pincode._id)}>
                                    <img src={removedIcon} alt="Delete" style={{ width: '20px' }} />
                                  </CButton>
                                </div>
                              )}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>

                    {currentPincodes.length > 0 && (
                      <div className="d-flex flex-column align-items-center gap-2">
                        <CPagination aria-label="Page navigation" style={paginationItemStyle}>
                          <CPaginationItem
                            aria-label="Previous"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <span aria-hidden="true">Previous</span>
                          </CPaginationItem>

                          {getPageNumbers().map((number) => (
                            <CPaginationItem
                              key={number}
                              active={number === currentPage}
                              onClick={() => handlePageChange(number)}
                            >
                              {number}
                            </CPaginationItem>
                          ))}

                          <CPaginationItem
                            aria-label="Next"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <span aria-hidden="true">Next</span>
                          </CPaginationItem>
                        </CPagination>

                        <div className="text-muted">
                          Showing {firstIndex + 1} to {Math.min(lastIndex, pincodes.length)} of{' '}
                          {pincodes.length} entries
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Pincode
