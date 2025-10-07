import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
  CSpinner
} from '@coreui/react'
import { APIURL, isSessionExpired } from '@/config/const'
import axiosInstance from '@/config/axiosInstance'

const ViewBusinessDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [businessDetails, setBusinessDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const activeTab = queryParams.get('tab') || 'all'
  const [isOnline, setIsOnline] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)


  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        // Fetch business details
        const detailsResponse = await axiosInstance.get(
          `${APIURL}api/business-details/${id}`
        );
        setBusinessDetails(detailsResponse.data);

        const userId = detailsResponse.data.userId._id;

        const eventSource = new EventSource(
          `${APIURL}api/business-details/status-stream/${userId}`
        );

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          setIsOnline(data.isOnline);
          setIsActive(data.isActive);
        };

        eventSource.onerror = (error) => {
          console.error("SSE error:", error);
          eventSource.close();
        };

        return () => {
          eventSource.close();
        };
      } catch (error) {
        console.error("Error fetching business details:", error);
        Swal.fire("Error!", "Failed to fetch business details", "error").then(() => {
          window.location.reload();
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [id]);

  useEffect(() => {
    if (isSessionExpired()) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        icon: 'error',
        confirmButtonText: 'Login',
      }).then(() => {
        navigate('/login')
      })
    }
  }, [navigate])

  const handleAction = async (type) => {
    setActionType(type);

    if (type === 'approve') {
      await handleSubmit(type);
    } else {
      setShowModal(true);
    }
  };

  const handleSubmit = async (type) => {
    if (!businessDetails.userId?.email) {
      Swal.fire('Error!', 'Email is missing', 'error')
      return
    }

    setIsSubmitting(true)
    setActionType(type)

    try {
      const endpoint =
        type === 'approve'
          ? `${APIURL}api/business-details/approve/${id}`
          : `${APIURL}api/business-details/reject/${id}`

      const response = await axiosInstance.post(endpoint, {
        email: businessDetails.userId.email,
        remarks: type === 'rejecte' ? remarks : undefined,
      })

      if (response.status === 201) {
        await Swal.fire('Success!', `Seller Details ${type}d successfully!`, 'success')

        setBusinessDetails((prev) => ({
          ...prev,
          isApproved: type === 'approve',
          isRejected: type === 'rejecte',
        }))

        setShowModal(false)
        setRemarks('')

        setShowSpinner(true)
        setTimeout(() => {
          setShowSpinner(false)
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error(`Error ${type}ing business details:`, error)
      const errorMessage = error.response?.data?.message || `Error ${type}ing seller`
      Swal.fire('Error!', errorMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleBack = () => {
    navigate(`/RegisterSeller?tab=${activeTab}`)
  }

  const handleOnlineOfflineToggle = async () => {
    const action = isOnline ? 'offline' : 'online'
    const confirmMessage = `Are you sure you want to set this seller as ${action}?`

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: confirmMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, set ${action}!`,
    })

    if (result.isConfirmed) {
      setIsActionLoading(true)
      try {
        const newStatus = !isOnline
        const response = await axiosInstance.post(APIURL + `api/business-details/online-offline/${id}`, {
          isOnline: newStatus,
        })

        if (response.status === 201) {
          setTimeout(() => {
            setIsOnline(newStatus)
            Swal.fire({
              title: 'Success!',
              text: `Seller is now ${newStatus ? 'Online' : 'Offline'}`,
              icon: 'success',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false
            });
            setIsActionLoading(false)
          }, 2000)
        }
      } catch (error) {
        console.error('Error toggling online/offline status:', error)
        Swal.fire('Error!', 'Failed to update online/offline status', 'error')
        setIsActionLoading(false)
      }
    }
  }

  const handleBlockUnblockToggle = async () => {
    const action = isActive ? 'block' : 'unblock'
    const confirmMessage = `Are you sure you want to ${action} this seller?`

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: confirmMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action} it!`,
    })

    if (result.isConfirmed) {
      setIsActionLoading(true) // Show loader
      try {
        const endpoint = isActive
          ? `${APIURL}api/business-details/block/${id}`
          : `${APIURL}api/business-details/unblock/${id}`

        const response = await axiosInstance.post(endpoint)

        if (response.status === 201) {
          setTimeout(() => {
            setIsActive(!isActive);
            Swal.fire({
              title: 'Success!',
              text: `Seller is now ${isActive ? 'Blocked' : 'Unblocked'}`,
              icon: 'success',
              timer: 2000, // Closes after 2 seconds
              timerProgressBar: true,
              showConfirmButton: false
            }).then(() => {
              window.location.reload();
            });

            setIsActionLoading(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Error toggling block/unblock status:', error)
        Swal.fire('Error!', 'Failed to update block/unblock status', 'error')
        setIsActionLoading(false)
      }
    }
  }

  if (loading || showSpinner || isActionLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <CSpinner color="primary" style={{ width: '4rem', height: '4rem' }} />
      </div>
    )
  }

  if (!businessDetails) {
    return <div>No business details found.</div>
  }

  return (
    <CRow>
      <CCol xs={12}>
        <div className="d-flex justify-content-end mb-2">
          <h5>
            {/* Display APPROVED or REJECTED badge */}
            {businessDetails.isApproved && businessDetails.isActive && (
              <CBadge
                color="success"
                className="ms-2"
                style={{ fontSize: '1rem', padding: '10px 20px' }}
              >
                APPROVED
              </CBadge>
            )}
            {!businessDetails.isActive && (
              <CBadge
                color="dark"
                className="ms-2"
                style={{ fontSize: '1rem', padding: '10px 20px' }}
              >
                BLOCKED
              </CBadge>
            )}
            {businessDetails.isRejected && (
              <CBadge
                color="danger"
                className="ms-2"
                style={{ fontSize: '1rem', padding: '10px 20px' }}
              >
                REJECTED
              </CBadge>
            )}
          </h5>
        </div>
        <CCard className="mb-4">
          <CCardHeader className="text-center bg-primary text-white mb-1">
            <h5>
              <b>Registered Seller Details</b>
            </h5>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow>
                {/* Display business details */}
                {businessDetails.businessName && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">Business Name</CFormLabel>
                    <CFormInput type="text" value={businessDetails.businessName} disabled />
                  </CCol>
                )}

                {businessDetails.gstNumber && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">GST Number</CFormLabel>
                    <CFormInput type="text" value={businessDetails.gstNumber} disabled />
                  </CCol>
                )}

                {businessDetails.userId?.email && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">Email</CFormLabel>
                    <CFormInput type="email" value={businessDetails.userId.email} disabled />
                  </CCol>
                )}

                {businessDetails.userId?.mobile_number && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">Phone Number</CFormLabel>
                    <CFormInput type="text" value={businessDetails.userId.mobile_number} disabled />
                  </CCol>
                )}

                {businessDetails.address && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">Address</CFormLabel>
                    <CFormInput type="text" value={businessDetails.address} disabled />
                  </CCol>
                )}

                {businessDetails.pincode && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">Pin Code</CFormLabel>
                    <CFormInput type="text" value={businessDetails.pincode} disabled />
                  </CCol>
                )}

                {businessDetails.category && (
                  <CCol md={6} className="mb-3">
                    <CFormLabel className="mb-1">Business Category</CFormLabel>
                    <CFormInput
                      type="text"
                      value={
                        Array.isArray(businessDetails.category)
                          ? businessDetails.category.join(', ')
                          : businessDetails.category
                      }
                      disabled
                    />
                  </CCol>
                )}

                {/* Approve, Reject, Back Buttons */}
                <CCol xs={12} className="text-center mt-3">
                  {!businessDetails.isApproved && !businessDetails.isRejected ? (
                    <>
                      <CButton
                        color="success"
                        className="text-white me-2"
                        onClick={() => handleAction('approve')}
                        disabled={isSubmitting || businessDetails.isApproved || businessDetails.isRejected}
                      >
                        {isSubmitting && actionType === 'approve' ? 'Approving...' : 'Approve'}
                      </CButton>
                      <CButton
                        color="danger"
                        className="text-white me-2"
                        onClick={() => handleAction('rejecte')}
                        disabled={isSubmitting || businessDetails.isApproved || businessDetails.isRejected}
                      >
                        {isSubmitting && actionType === 'rejecte' ? 'Rejecting...' : 'Reject'}
                      </CButton>
                    </>
                  ) : businessDetails.isApproved ? (
                    <>
                      {/* Only show online/offline and block/unblock buttons if approved */}
                      <CButton
                        color={isOnline ? 'danger' : 'success'}
                        className=" me-2 text-white bg-black border border-black hover:bg-black hover:text-white"
                        onClick={handleOnlineOfflineToggle}
                      >
                        {isOnline ? 'Offline' : 'Online'}
                      </CButton>

                      <CButton
                        color={isActive ? 'primary' : 'danger'}
                        className=" text-white bg-black border border-green-800 hover:bg-black hover:text-whites me-2"
                        onClick={handleBlockUnblockToggle}
                      >
                        {isActive ? 'Block' : 'Unblock'}
                      </CButton>
                    </>
                  ) : null}{' '}
                  {/* Hide completely if rejected */}
                  <CButton color="secondary" onClick={handleBack}>
                    Back
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* Modal for Remarks */}
        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader>
            <CModalTitle>Reject Seller</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CFormInput
              type="text"
              placeholder="Add your remarks here"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </CButton>
            <CButton
              color="primary"
              onClick={() => handleSubmit('rejecte')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit'}
            </CButton>
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default ViewBusinessDetails
