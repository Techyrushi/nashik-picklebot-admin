import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
  CNav,
  CNavItem,
  CNavLink,
  CPagination,
  CPaginationItem,
  CFormInput,
  CInputGroup,
} from '@coreui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APIURL, isSessionExpired } from '@/config/const';
import axiosInstance from '@/config/axiosInstance';
import viewIcon from '/public/view.png';
import Preloader from 'src/components/Preloader.js';

const RegisterSeller = () => {
  const [businessDetails, setBusinessDetails] = useState([]);
  const [filteredBusinessDetails, setFilteredBusinessDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Combined search state
  const [search, setSearch] = useState({
    searchTerm: '',
    pincode: '',
    fromDate: null,
    toDate: null,
    sortField: '',
    sortOrder: '',
  });

  const [pincodeOptions, setPincodeOptions] = useState([]);

  // Calculate pagination values
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const currentBusiness = filteredBusinessDetails.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredBusinessDetails.length / recordsPerPage);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'all';
    setActiveTab(tab);
  }, [searchParams]);

  const fetchBusinessDetails = async () => {
    const startTime = Date.now();

    try {
      const response = await axiosInstance.get(`${APIURL}api/business-details`);
      const data = response.data;

      // Filter data based on the active tab
      const filteredData =
        activeTab === 'pending'
          ? data.filter((item) => !item.isApproved && !item.isRejected)
          : activeTab === 'approved'
            ? data.filter((item) => item.isApproved && item.isActive)
            : activeTab === 'rejected'
              ? data.filter((item) => item.isRejected)
              : activeTab === 'blocked'
                ? data.filter((item) => !item.isActive)
                : data;

      setBusinessDetails(filteredData);
      applyFilters(filteredData);
    } catch (error) {
      console.error('Error fetching business details:', error);
    } finally {
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      const minimumDelay = 2000;

      if (elapsedTime < minimumDelay) {
        setTimeout(() => {
          setLoading(false);
        }, minimumDelay - elapsedTime);
      } else {
        setLoading(false);
      }
    }
  };

  const applyFilters = (data) => {
    let filtered = [...data];

    // Apply search term filter
    if (search.searchTerm) {
      const searchLower = search.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.businessName?.toLowerCase().includes(searchLower) ||
          item.userId?.email?.toLowerCase().includes(searchLower) ||
          item.userId?.mobile_number?.includes(search.searchTerm)
      );
    }

    // Apply pincode filter
    if (search.pincode) {
      filtered = filtered.filter((item) => item.pincode === search.pincode);
    }

    // Apply date range filter
    if (search.fromDate && search.toDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= search.fromDate && itemDate <= search.toDate;
      });
    }

    // Apply sorting
    if (search.sortField && search.sortOrder) {
      filtered.sort((a, b) => {
        let valueA = search.sortField === 'email' || search.sortField === 'mobile_number'
          ? a.userId?.[search.sortField]
          : a[search.sortField];
        let valueB = search.sortField === 'email' || search.sortField === 'mobile_number'
          ? b.userId?.[search.sortField]
          : b[search.sortField];

        valueA = valueA?.toString().toLowerCase() ?? '';
        valueB = valueB?.toString().toLowerCase() ?? '';

        if (search.sortOrder === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      });
    }

    setFilteredBusinessDetails(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    setLoading(false);
    fetchBusinessDetails();
    fetchPincodeOptions();
  }, [activeTab]);

  // Apply filters whenever search criteria changes
  useEffect(() => {
    applyFilters(businessDetails);
  }, [search]);

  const fetchPincodeOptions = async () => {
    try {
      const response = await axiosInstance.get(`${APIURL}api/business-details`);
      const pincodes = [...new Set(response.data.map((item) => item.pincode))];
      setPincodeOptions(pincodes.map((pincode) => ({ value: pincode, label: pincode })));
    } catch (error) {
      console.error('Error fetching pincodes:', error);
    }
  };

  // Session expiry check
  useEffect(() => {
    if (isSessionExpired()) {
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        icon: 'error',
        confirmButtonText: 'Login',
      }).then(() => {
        navigate('/login');
      });
    }
  }, [navigate]);

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

  const handleView = (id) => {
    navigate(`/forms/view-seller-registration/${id}?tab=${activeTab}`);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const clearFilters = () => {
    setSearch({
      searchTerm: '',
      pincode: '',
      fromDate: null,
      toDate: null,
      sortField: '',
      sortOrder: '',
    });

    setFilteredBusinessDetails([...businessDetails]);
    setCurrentPage(1);
    setResetKey((prevKey) => prevKey + 1);
  };

  const paginationItemStyle = {
    cursor: 'pointer',
    ':hover': {
      cursor: 'pointer'
    }
  }

  const handleDashboardAccess = async (sellerId) => {
    try {

      const response = await axiosInstance.post(`${APIURL}admin/admin-access/${sellerId}`);

      const { token, sellerDashboardUrl } = response.data;
      localStorage.setItem('adminToken', token);

      const dashboardUrl = sellerDashboardUrl.includes('?')
        ? `${sellerDashboardUrl}&adminToken=${token}`
        : `${sellerDashboardUrl}?adminToken=${token}`;

      window.open(dashboardUrl, '_blank');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'Could not access seller dashboard. Please try again.';

      Swal.fire({
        icon: 'info',
        title: 'Access Failed',
        text: errorMessage,
      });
    }
  };

  return (
    <>
      {/* Show Preloader if loading */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Preloader />
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <CNav variant="tabs" className="mb-4">
            {['all', 'pending', 'approved', 'rejected', 'blocked'].map((tab) => (
              <CNavItem key={tab}>
                <CNavLink
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ cursor: 'pointer' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Seller
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>

          {/* Search and Filters */}
          <CRow className="mb-3">
            <CCol md={3}>
              <CFormInput
                key={resetKey}
                placeholder="Search by name, email, or mobile"
                value={search.searchTerm}
                onChange={(e) => setSearch({ ...search, searchTerm: e.target.value })}
                style={paginationItemStyle}
              />
            </CCol>
            <CCol md={3}>
              <Select
                key={resetKey}
                options={pincodeOptions}
                placeholder="Select Pincode"
                isClearable
                onChange={(selected) => setSearch({ ...search, pincode: selected?.value || '' })}
                style={paginationItemStyle}
              />
            </CCol>
            <CCol md={2}>
              <DatePicker
                key={resetKey}
                selected={search.fromDate}
                onChange={(date) => setSearch({ ...search, fromDate: date })}
                placeholderText="From Date"
                className="form-control"
                style={paginationItemStyle}
              />
            </CCol>
            <CCol md={2}>
              <DatePicker
                key={resetKey}
                selected={search.toDate}
                onChange={(date) => setSearch({ ...search, toDate: date })}
                placeholderText="To Date"
                className="form-control"
                style={paginationItemStyle}
              />
            </CCol>
            <CCol md={2}>
              <Select
                key={resetKey}
                options={[
                  { value: 'businessName', label: 'Business Name' },
                  { value: 'email', label: 'Email' },
                  { value: 'mobile_number', label: 'Mobile Number' },
                  { value: 'pincode', label: 'Pincode' }
                ]}
                placeholder="Sort By"
                isClearable
                onChange={(selected) => setSearch({
                  ...search,
                  sortField: selected?.value || '',
                  sortOrder: selected ? (search.sortOrder || 'asc') : ''
                })}
                style={paginationItemStyle}
              />
            </CCol>
            {search.sortField && (
              <CCol md={2} className="mt-2">
                <Select
                  key={resetKey}
                  options={[
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' }
                  ]}
                  placeholder="Sort Order"
                  value={search.sortOrder ? { value: search.sortOrder, label: search.sortOrder === 'asc' ? 'Ascending' : 'Descending' } : null}
                  onChange={(selected) => setSearch({ ...search, sortOrder: selected?.value || '' })}
                  style={paginationItemStyle}
                />
              </CCol>
            )}
            <CCol md={12} className="mt-3 d-flex justify-content-end">
              <CButton color="primary" className="d-flex align-items-end" onClick={clearFilters} style={paginationItemStyle}>Clear Filters</CButton>
            </CCol>
          </CRow>

          {/* Seller List Table */}
          <CRow>
            <CCol xs>
              <CCard className="mb-4">
                <CCardHeader className="text-center bg-primary text-white mb-1">
                  <h5>
                    <b>
                      {activeTab === 'all' && 'Seller Registration List'}
                      {activeTab === 'pending' && 'Pending Seller List'}
                      {activeTab === 'approved' && 'Approved Seller List'}
                      {activeTab === 'rejected' && 'Rejected Seller List'}
                      {activeTab === 'blocked' && 'Blocked Seller List'}
                    </b>
                  </h5>
                </CCardHeader>

                {currentBusiness.length === 0 ? (
                  <div className="text-center py-4 text-danger fw-bold">No Data Available</div>
                ) : (
                  <>
                    <CTable align="middle" className="mb-0 table-bordered table-striped" hover responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell className="text-center">#</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Business Name</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Email</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Phone Number</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Pin Code</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Status</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Dashboard Access</CTableHeaderCell>
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
                            <CTableDataCell className="text-center">{business.pincode}</CTableDataCell>
                            <CTableDataCell className="text-center">
                              {!business.isActive ? (
                                <CBadge color="dark">Blocked</CBadge>
                              ) : business.isApproved ? (
                                <CBadge color="success">Approved</CBadge>
                              ) : business.isRejected ? (
                                <CBadge color="danger">Rejected</CBadge>
                              ) : (
                                <CBadge color="warning">Pending</CBadge>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton size="sm" onClick={() => handleView(business._id)}>
                                <img src={viewIcon} alt="Edit" style={{ width: '30px' }} />
                              </CButton>
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton
                                color="primary"
                                size="sm"
                                onClick={() => handleDashboardAccess(business.userId?._id)}
                              >
                                Go to Dashboard
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>

                    {/* Pagination */}
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
                  </>
                )}
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </>
  );
};

export default RegisterSeller;
