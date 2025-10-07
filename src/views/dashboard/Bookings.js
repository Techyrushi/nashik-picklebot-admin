import React, { useState, useEffect } from 'react'
import {
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
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormTextarea,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CFormSelect,
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload } from '@coreui/icons'
import api from '../../api';
import Swal from 'sweetalert2'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns'

const Bookings = () => {
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [groupedByWhatsapp, setGroupedByWhatsapp] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [message, setMessage] = useState("");
  const [whatsappFilter, setWhatsappFilter] = useState("");
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
  
  // New state variables for enhanced filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courtFilter, setCourtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState(1);
  const [courts, setCourts] = useState([]);
  const [viewMode, setViewMode] = useState("daily"); // daily, weekly, monthly

  async function loadCourts() {
    try {
      const response = await api.get('/api/admin/courts');
      setCourts(response.data);
    } catch (error) {
      console.error("Error loading courts:", error);
    }
  }

  async function loadBookings() { 
    try {
      const response = await api.get('/api/admin/bookings'); 
      setList(response.data);
      applyFilters(response.data);
      
      // Group bookings by WhatsApp number
      const grouped = {};
      response.data.forEach(booking => {
        if (booking.whatsapp) {
          if (!grouped[booking.whatsapp]) {
            grouped[booking.whatsapp] = [];
          }
          grouped[booking.whatsapp].push(booking);
        }
      });
      
      // Convert to array format for display
      const groupedArray = Object.keys(grouped).map(whatsapp => ({
        whatsapp,
        bookings: grouped[whatsapp],
        count: grouped[whatsapp].length
      }));
      
      setGroupedByWhatsapp(groupedArray);
    } catch (error) {
      console.error("Error loading bookings:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load bookings. Please try again.'
      });
    }
  }

  useEffect(() => {
    loadCourts();
    loadBookings(); 
    
    // Set default date range based on view mode
    setDateRangeByViewMode(viewMode);
  }, []);
  
  function setDateRangeByViewMode(mode) {
    const today = new Date();
    
    switch(mode) {
      case 'daily':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'weekly':
        setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'));
        break;
      case 'monthly':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      default:
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
    }
  }
  
  function applyFilters(bookings) {
    let filtered = [...bookings];
    
    // Apply date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(booking => {
        if (!booking.date) return false;
        // Parse the booking date to ensure proper comparison
        const bookingDate = booking.date.split('T')[0]; // Handle ISO date format if present
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }
    
    // Apply court filter
    if (courtFilter) {
      filtered = filtered.filter(booking => booking.courtId === courtFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Apply WhatsApp filter
    if (whatsappFilter) {
      filtered = filtered.filter(booking => 
        booking.whatsapp && booking.whatsapp.includes(whatsappFilter)
      );
    }
    
    setFilteredList(filtered);
  }
  
  useEffect(() => {
    applyFilters(list);
  }, [startDate, endDate, courtFilter, statusFilter, whatsappFilter, list]);
  
  function handleViewModeChange(mode) {
    setViewMode(mode);
    setDateRangeByViewMode(mode);
  }
  
  function exportBookings() {
    try {
      // Create CSV content
      let csvContent = "Booking ID,Date,Time,Court,User,Amount,Status\n";
      
      filteredList.forEach(booking => {
        const row = [
          booking._id,
          booking.date,
          booking.slot,
          booking.courtName,
          booking.whatsapp,
          booking.amount,
          booking.status
        ].join(',');
        
        csvContent += row + "\n";
      });
      
      // Create download link
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `bookings_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      
      // Download the CSV file
      link.click();
      document.body.removeChild(link);
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Bookings exported successfully!'
      });
    } catch (error) {
      console.error("Error exporting bookings:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to export bookings. Please try again.'
      });
    }
  }

  function openMessageModal(id) {
    setSelectedBookingId(id);
    setMessage("");
    setVisible(true);
  }

  function viewBookingsByWhatsapp(whatsapp) {
    setSelectedWhatsapp(whatsapp);
    setShowDetailView(true);
    // Reset filters when switching to detail view
    setDateRangeByViewMode(viewMode);
    setCourtFilter("");
    setStatusFilter("");
  }

  function backToGroupView() {
    setShowDetailView(false);
    setSelectedWhatsapp("");
    // Reset WhatsApp filter when going back to group view
    setWhatsappFilter("");
  }

  async function sendMessage() {
    if (!message.trim()) return;
    
    try {
      await api.post(`/api/admin/bookings/${selectedBookingId}/sendMessage`, { message });
      setVisible(false);
      alert('Message sent successfully');
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message');
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>
                {showDetailView 
                  ? `Bookings for ${selectedWhatsapp}` 
                  : 'Bookings Management - Grouped by WhatsApp'}
              </strong>
              <CButtonGroup className="float-end">
                {showDetailView && (
                  <CButton 
                    color="primary" 
                    size="sm"
                    onClick={backToGroupView}
                  >
                    Back to All WhatsApp Numbers
                  </CButton>
                )}
                <CButton 
                  color="success" 
                  size="sm"
                  onClick={exportBookings}
                >
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Export
                </CButton>
              </CButtonGroup>
            </CCardHeader>
            <CCardBody>
              {/* View Mode Tabs and Filters - ONLY SHOW IN DETAIL VIEW */}
              {showDetailView && (
                <>
                  {/* View Mode Tabs */}
                  <CNav variant="tabs" className="mb-3">
                    <CNavItem>
                      <CNavLink 
                        active={viewMode === 'daily'}
                        onClick={() => handleViewModeChange('daily')}
                        style={{ cursor: 'pointer' }}
                      >
                        Daily
                      </CNavLink>
                    </CNavItem>
                    <CNavItem>
                      <CNavLink 
                        active={viewMode === 'weekly'}
                        onClick={() => handleViewModeChange('weekly')}
                        style={{ cursor: 'pointer' }}
                      >
                        Weekly
                      </CNavLink>
                    </CNavItem>
                    <CNavItem>
                      <CNavLink 
                        active={viewMode === 'monthly'}
                        onClick={() => handleViewModeChange('monthly')}
                        style={{ cursor: 'pointer' }}
                      >
                        Monthly
                      </CNavLink>
                    </CNavItem>
                  </CNav>
                  
                  {/* View Mode Display */}
                  <div className="mb-3">
                    <CBadge color="info">Viewing: {viewMode.toUpperCase()} view</CBadge>
                    {startDate && endDate && (
                      <CBadge color="secondary" className="ms-2">
                        {startDate} to {endDate}
                      </CBadge>
                    )}
                  </div>
                  
                  {/* Filters - ONLY IN DETAIL VIEW */}
                  <CRow className="mb-3">
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        label="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        label="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        label="Court"
                        value={courtFilter}
                        onChange={(e) => setCourtFilter(e.target.value)}
                      >
                        <option value="">All Courts</option>
                        {courts.map((court) => (
                          <option key={court._id} value={court._id}>
                            {court.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending_payment">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>
                  
                  {/* Clear Filters Button - ONLY IN DETAIL VIEW */}
                  <CRow className="mb-3">
                    <CCol>
                      <CButton 
                        color="secondary" 
                        onClick={() => {
                          // Reset all filters to default values
                          setDateRangeByViewMode(viewMode);
                          setCourtFilter("");
                          setStatusFilter("");
                        }}
                      >
                        Clear All Filters
                      </CButton>
                    </CCol>
                  </CRow>
                  
                  {/* Results Count - ONLY IN DETAIL VIEW */}
                  <div className="mb-3">
                    <strong>Results: {filteredList.length} bookings found</strong>
                  </div>
                </>
              )}
              
              {/* WhatsApp Filter - ONLY SHOW IN GROUPED VIEW */}
              {!showDetailView && (
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CInputGroup>
                      <CInputGroupText>Search WhatsApp Number</CInputGroupText>
                      <CFormInput
                        placeholder="Enter WhatsApp number to filter..."
                        value={whatsappFilter}
                        onChange={(e) => setWhatsappFilter(e.target.value)}
                      />
                      {whatsappFilter && (
                        <CButton color="secondary" onClick={() => setWhatsappFilter("")}>
                          Clear
                        </CButton>
                      )}
                    </CInputGroup>
                  </CCol>
                  <CCol md={6} className="d-flex align-items-end">
                    <div>
                      <CBadge color="info" className="me-2">
                        Total Users: {groupedByWhatsapp.filter(item => !whatsappFilter || item.whatsapp.includes(whatsappFilter)).length}
                      </CBadge>
                      <CBadge color="primary">
                        Total Bookings: {groupedByWhatsapp
                          .filter(item => !whatsappFilter || item.whatsapp.includes(whatsappFilter))
                          .reduce((total, item) => total + item.count, 0)}
                      </CBadge>
                    </div>
                  </CCol>
                </CRow>
              )}
              
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    {showDetailView ? (
                      <>
                        <CTableHeaderCell scope="col">Booking ID</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Time Slot</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Court</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Amount (₹)</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                      </>
                    ) : (
                      <>
                        <CTableHeaderCell scope="col">WhatsApp Number</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Bookings Count</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                      </>
                    )}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {showDetailView ? (
                    filteredList.length > 0 ? (
                      filteredList.map(booking => (
                        <CTableRow key={booking._id}>
                          <CTableDataCell>{booking._id.substring(0, 8)}...</CTableDataCell>
                          <CTableDataCell>{booking.date}</CTableDataCell>
                          <CTableDataCell>{booking.slot}</CTableDataCell>
                          <CTableDataCell>{booking.courtName}</CTableDataCell>
                          <CTableDataCell>₹{booking.amount}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge 
                              color={
                                booking.status === 'confirmed' ? 'success' : 
                                booking.status === 'pending_payment' ? 'warning' : 'danger'
                              }
                            >
                              {booking.status}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CButton 
                              color="primary" 
                              size="sm" 
                              onClick={() => openMessageModal(booking._id)}
                            >
                              Send Message
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan="7" className="text-center">
                          No bookings found for the selected filters
                        </CTableDataCell>
                      </CTableRow>
                    )
                  ) : (
                    groupedByWhatsapp
                      .filter(item => !whatsappFilter || item.whatsapp.includes(whatsappFilter))
                      .map(item => (
                        <CTableRow key={item.whatsapp}>
                          <CTableDataCell>{item.whatsapp}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="primary" shape="rounded-pill">{item.count}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CButton 
                              color="info" 
                              size="sm" 
                              onClick={() => viewBookingsByWhatsapp(item.whatsapp)}
                            >
                              View Bookings
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Send Message to Customer</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormTextarea
            rows={5}
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></CFormTextarea>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={sendMessage}>Send</CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Bookings;