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
  CPagination,
  CPaginationItem,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CListGroup,
  CListGroupItem,
  CCardBody,
  CCardImage,
  CInputGroup,
} from '@coreui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APIURL, isSessionExpired } from '@/config/const';
import axiosInstance from '@/config/axiosInstance';
import viewIcon from '/public/view.png';
import Preloader from 'src/components/Preloader.js';

const RegisterCustomer = () => {
  const [businessDetails, setBusinessDetails] = useState([]);
  const [filteredBusinessDetails, setFilteredBusinessDetails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [visibleModal, setVisibleModal] = useState(false);

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

  const fetchBusinessDetails = async () => {
    const startTime = Date.now();

    try {
      const response = await axiosInstance.get(`${APIURL}customers/admins/all`);
      const data = response.data;
      setBusinessDetails(data);
      applyFilters(data);
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
          item.full_name?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.mobile_number?.includes(search.searchTerm)
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
        let valueA = a[search.sortField];
        let valueB = b[search.sortField];

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
  }, []);

  // Apply filters whenever search criteria changes
  useEffect(() => {
    applyFilters(businessDetails);
  }, [search]);

  const fetchPincodeOptions = async () => {
    try {
      const response = await axiosInstance.get(`${APIURL}customers/admins/all`);
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

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setVisibleModal(true);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                  { value: 'full_name', label: 'Customer Name' },
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
                    <b>Customer Registration List</b>
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
                          <CTableHeaderCell className="text-center">Customer Name</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Email</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Phone Number</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Status</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {currentBusiness.map((business, index) => (
                          <CTableRow key={business._id}>
                            <CTableDataCell className="text-center">
                              {firstIndex + index + 1}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.full_name || '-'}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.email || '-'}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.mobile_number || '-'}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              {business.isActive ? (
                                <CBadge color="success">Active</CBadge>
                              ) : (
                                <CBadge color="danger">Inactive</CBadge>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CButton size="sm" onClick={() => handleView(business)}>
                                <img src={viewIcon} alt="View" style={{ width: '20px' }} />
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

          {/* Customer Details Modal */}
          <CModal
            visible={visibleModal}
            onClose={() => setVisibleModal(false)}
            size="lg"
          >
            <CModalHeader>
              <CModalTitle>Customer Details</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {selectedCustomer && (
                <CRow>
                  <CCol md={4}>
                    <CCard className="mb-3">
                      <CCardImage
                        orientation="top"
                        src={selectedCustomer.avatar || 'https://i.ibb.co/Z1KB3KRC/samplepic.png'}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <CCardBody className="text-center">
                        <h5>{selectedCustomer.full_name}</h5>
                        <CBadge color={selectedCustomer.isActive ? 'success' : 'danger'}>
                          {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={8}>
                    <CListGroup>
                      <CListGroupItem>
                        <strong>Email:</strong> {selectedCustomer.email || 'N/A'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Mobile:</strong> {selectedCustomer.mobile_number || 'N/A'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Business Name:</strong> {selectedCustomer.my_business_name || 'N/A'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Gender:</strong> {selectedCustomer.gender || 'N/A'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Date of Birth:</strong> {formatDate(selectedCustomer.date_of_birth)}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Occupation:</strong> {selectedCustomer.occupation || 'N/A'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Education:</strong> {selectedCustomer.education || 'N/A'}
                      </CListGroupItem>
                      <CListGroupItem>
                        <strong>Monthly Income:</strong> {selectedCustomer.monthly_income ? `₹${selectedCustomer.monthly_income}` : 'N/A'}
                      </CListGroupItem>
                    </CListGroup>
                  </CCol>
                  <CCol md={12} className="mt-3">
                    <CRow>
                      <CCol md={6}>
                        <CListGroup>
                          <CListGroupItem>
                            <strong>Marital Status:</strong> {selectedCustomer.marital_status || 'N/A'}
                          </CListGroupItem>
                          <CListGroupItem>
                            <strong>Number of Kids:</strong> {selectedCustomer.number_of_kids || '0'}
                          </CListGroupItem>
                        </CListGroup>
                      </CCol>
                      <CCol md={6}>
                        <CListGroup>
                          <CListGroupItem>
                            <strong>Address:</strong> {selectedCustomer.pincode ? `${selectedCustomer.city}, ${selectedCustomer.state} - ${selectedCustomer.pincode}` : 'N/A'}
                          </CListGroupItem>
                          <CListGroupItem>
                            <strong>Registered On:</strong> {formatDate(selectedCustomer.createdAt)}
                          </CListGroupItem>
                        </CListGroup>
                      </CCol>
                    </CRow>
                  </CCol>
                </CRow>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setVisibleModal(false)}>
                Close
              </CButton>
            </CModalFooter>
          </CModal>
        </>
      )}
    </>
  );
};

export default RegisterCustomer;
