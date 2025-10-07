import React, { useEffect, useState } from 'react';
import axiosInstance from '@/config/axiosInstance';
import Swal from 'sweetalert2';
import {
  CButton,
  CCard,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CPagination,
  CPaginationItem,
  CCardBody,
  CForm,
  CFormLabel,
  CFormInput
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import viewIcon from '/public/view.png';
import { APIURL, isSessionExpired } from '@/config/const';
import Preloader from 'src/components/Preloader.js';

const CommissionManagement = () => {
  const [businessDetails, setBusinessDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const navigate = useNavigate();
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const currentBusiness = businessDetails.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(businessDetails.length / recordsPerPage);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const startTime = Date.now(); // Start time for delay handling
      try {
        const response = await axiosInstance.get(`${APIURL}api/business-details`);
        const data = response.data;

        setBusinessDetails(data.filter((item) => item.isApproved));

        const commissionResponse = await axiosInstance.get(`${APIURL}commission/get`);
        setCommissionPercentage(commissionResponse.data?.percentage || '');
      } catch (error) {
        console.error('Error fetching business details:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch business details. Please try again later.',
        });
      } finally {
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const minimumDelay = 2000;

        if (elapsedTime < minimumDelay) {
          setTimeout(() => setLoading(false), minimumDelay - elapsedTime);
        } else {
          setLoading(false);
        }
      }
    };

    if (isSessionExpired()) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        icon: 'error',
        confirmButtonText: 'Login',
      }).then(() => {
        navigate('/login');
      });
    } else {
      setLoading(true);
      fetchBusinessDetails();
    }
  }, [navigate]);

  const handleCommissionUpdate = async (e) => {
    e.preventDefault();
    if (!commissionPercentage || isNaN(commissionPercentage) || commissionPercentage < 0) {
      return Swal.fire('Error', 'Please enter a valid commission percentage.', 'error');
    }

    try {
      await axiosInstance.post(`${APIURL}commission/set`, { percentage: Number(commissionPercentage) });
      Swal.fire('Success', 'Commission percentage updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating commission:', error);
      Swal.fire('Error', 'Failed to update commission. Please try again later.', 'error');
    }
  };

  const handleView = (userId) => {
    if (userId) {
      navigate(`/forms/commission-management/${userId}`);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No products found for this seller.',
      });
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const paginationItemStyle = {
    cursor: 'pointer',
    ':hover': {
      cursor: 'pointer'
    }
  }

  return (
    <>
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
          <CCol xs>
            <CCard className="mb-4">
              <CCardHeader className="bg-primary text-white text-center">
                <h5><b>Commission Management</b></h5>
              </CCardHeader>
              <CCardBody>
                {/* Commission Update Form */}
                <CForm onSubmit={handleCommissionUpdate} className="mb-4 d-flex align-items-center gap-3">
                  <CFormLabel className="mb-0 fw-bold">Commission Percentage:</CFormLabel>
                  <CFormInput
                    type="number"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(e.target.value)}
                    min="0"
                    step="0.1"
                    style={{ width: '100px' }}
                  />
                  <CButton type="submit" color="primary">Update</CButton>
                </CForm>

                {businessDetails.length === 0 ? (
                  <div className="text-center text-danger py-3 fw-bold">
                    No Data Available
                  </div>
                ) : (
                  <>
                    <CTable align="middle" hover bordered responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell className="text-center">#</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Business Name</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Email</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Phone Number</CTableHeaderCell>
                          {/* <CTableHeaderCell className="text-center">Business Category</CTableHeaderCell> */}
                          {/* <CTableHeaderCell className="text-center">Status</CTableHeaderCell> */}
                          <CTableHeaderCell className="text-center">View</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {currentBusiness.map((business, index) => (
                          <CTableRow key={business._id}>
                            <CTableDataCell className="text-center">
                              {firstIndex + index + 1}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.businessName}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.userId?.email || 'N/A'}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.userId?.mobile_number || 'N/A'}
                            </CTableDataCell>
                            {/* <CTableDataCell className="text-center">
                            {Array.isArray(business.category)
                              ? business.category.join(', ')
                              : business.category}
                          </CTableDataCell> */}
                            {/* <CTableDataCell className="text-center">
                            <CBadge color="success">Approved</CBadge>
                          </CTableDataCell> */}
                            <CTableDataCell className="text-center">
                              <CButton
                                size="sm"
                                onClick={() => handleView(business.userId?._id)}
                                disabled={!business.userId?._id}
                              >
                                <img src={viewIcon} alt="View" style={{ width: '30px' }} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>

                    {/* Pagination */}
                    {currentBusiness.length > 0 && (
                      <div className="d-flex flex-column align-items-center gap-2 mt-3">
                        <CPagination aria-label="Page navigation" style={paginationItemStyle}>
                          <CPaginationItem
                            aria-label="Previous"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
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
                            Next
                          </CPaginationItem>
                        </CPagination>
                        <div className="text-muted mb-3">
                          Showing {firstIndex + 1} to {Math.min(lastIndex, businessDetails.length)} of{' '}
                          {businessDetails.length} entries
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
  );
};

export default CommissionManagement;
