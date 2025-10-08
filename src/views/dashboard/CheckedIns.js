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
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload } from '@coreui/icons'
import api from '../../api'
import Swal from 'sweetalert2'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

const CheckedIns = () => {
  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [groupedByWhatsapp, setGroupedByWhatsapp] = useState([])
  const [visible, setVisible] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [message, setMessage] = useState('')
  const [whatsappFilter, setWhatsappFilter] = useState('')
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedWhatsapp, setSelectedWhatsapp] = useState('')

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [courtFilter, setCourtFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [courts, setCourts] = useState([])
  const [viewMode, setViewMode] = useState('daily')

  // Load courts
  async function loadCourts() {
    try {
      const response = await api.get('/api/admin/courts')
      setCourts(response.data)
    } catch (error) {
      console.error('Error loading courts:', error)
    }
  }

  // Load only checkedIn bookings
  async function loadBookings() {
    try {
      const response = await api.get('/api/admin/bookings')
      // ✅ Only include bookings with checkedIn = true
      const checkedInBookings = response.data.filter((b) => b.checkedIn === true)


      setList(checkedInBookings)
      applyFilters(checkedInBookings)

      // Group by WhatsApp
      const grouped = {}
      checkedInBookings.forEach((booking) => {
        if (booking.whatsapp) {
          if (!grouped[booking.whatsapp]) grouped[booking.whatsapp] = []
          grouped[booking.whatsapp].push(booking)
        }
      })

      const groupedArray = Object.keys(grouped).map((whatsapp) => ({
        whatsapp,
        bookings: grouped[whatsapp],
        count: grouped[whatsapp].length,
      }))

      setGroupedByWhatsapp(groupedArray)
    } catch (error) {
      console.error('Error loading bookings:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load bookings. Please try again.',
      })
    }
  }

  useEffect(() => {
    loadCourts()
    loadBookings()
    setDateRangeByViewMode(viewMode)
  }, [])

  function setDateRangeByViewMode(mode) {
    const today = new Date()
    switch (mode) {
      case 'daily':
        setStartDate(format(today, 'yyyy-MM-dd'))
        setEndDate(format(today, 'yyyy-MM-dd'))
        break
      case 'weekly':
        setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'))
        setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'))
        break
      case 'monthly':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
        break
      default:
        setStartDate(format(today, 'yyyy-MM-dd'))
        setEndDate(format(today, 'yyyy-MM-dd'))
    }
  }

  // Apply filters
  function applyFilters(bookings) {
    let filtered = [...bookings]

    // Date filter
    if (startDate && endDate) {
      filtered = filtered.filter((b) => {
        if (!b.date) return false
        const bookingDate = b.date.split('T')[0]
        return bookingDate >= startDate && bookingDate <= endDate
      })
    }

    // Court filter
    if (courtFilter) filtered = filtered.filter((b) => b.courtId === courtFilter)

    // Status filter
    if (statusFilter) filtered = filtered.filter((b) => b.status === statusFilter)

    // WhatsApp filter
    if (whatsappFilter)
      filtered = filtered.filter((b) => b.whatsapp && b.whatsapp.includes(whatsappFilter))

    // ✅ Always ensure checkedIn only
    filtered = filtered.filter((b) => b.checkedIn === true)


    setFilteredList(filtered)
  }

  useEffect(() => {
    applyFilters(list)
  }, [startDate, endDate, courtFilter, statusFilter, whatsappFilter, list])

  function handleViewModeChange(mode) {
    setViewMode(mode)
    setDateRangeByViewMode(mode)
  }

  // Get bookings for selected WhatsApp in detail view
  const getDetailViewBookings = () => {
    if (!selectedWhatsapp) return []

    const detailBookings = list.filter((b) => b.whatsapp === selectedWhatsapp && b.checkedIn === true)

    return detailBookings
  }

  // Export checked-in bookings
  function exportBookings() {
    try {
      const bookingsToExport = showDetailView ? getDetailViewBookings() : filteredList

      let csvContent = 'Booking ID,Date,Time,Court,Duration,User,Amount,Status,Checked-In Time\n'
      bookingsToExport.forEach((b) => {
        const row = [
          b.bookingId || 'N/A',
          b.date,
          b.slot,
          b.courtName,
          b.duration || 'N/A',
          b.whatsapp,
          b.amount,
          b.status,
          b.checkedInTime ? format(new Date(b.checkedInTime), 'yyyy-MM-dd HH:mm') : 'N/A'
        ].join(',')
        csvContent += row + '\n'
      })

      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `checkedin_bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      Swal.fire({
        icon: 'success',
        title: 'Exported!',
        text: 'Checked-in bookings exported successfully.',
      })
    } catch (error) {
      console.error('Error exporting:', error)
      Swal.fire({
        icon: 'error',
        title: 'Export failed',
      })
    }
  }

  function openMessageModal(id) {
    setSelectedBookingId(id)
    setMessage('')
    setVisible(true)
  }

  function viewBookingsByWhatsapp(whatsapp) {
    setSelectedWhatsapp(whatsapp)
    setShowDetailView(true)
  }

  function backToGroupView() {
    setShowDetailView(false)
    setSelectedWhatsapp('')
  }

  async function sendMessage() {
    if (!message.trim()) return
    try {
      await api.post(`/api/admin/bookings/${selectedBookingId}/sendMessage`, { message })
      setVisible(false)
      Swal.fire({
        icon: 'success',
        title: 'Message sent successfully!',
      })
    } catch (error) {
      Swal.fire('Failed to send message!')
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
                  ? `Checked-In Bookings for ${selectedWhatsapp}`
                  : 'Checked-In Users - Grouped by WhatsApp'}
              </strong>
              <CButtonGroup className="float-end">
                {showDetailView && (
                  <CButton color="primary" size="sm" onClick={backToGroupView}>
                    Back to Group View
                  </CButton>
                )}
                <CButton color="success" size="sm" onClick={exportBookings}>
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Export
                </CButton>
              </CButtonGroup>
            </CCardHeader>
            <CCardBody>
              {!showDetailView && (
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CInputGroup>
                      <CInputGroupText>Search WhatsApp</CInputGroupText>
                      <CFormInput
                        placeholder="Enter WhatsApp number..."
                        value={whatsappFilter}
                        onChange={(e) => setWhatsappFilter(e.target.value)}
                      />
                      {whatsappFilter && (
                        <CButton color="secondary" onClick={() => setWhatsappFilter('')}>
                          Clear
                        </CButton>
                      )}
                    </CInputGroup>
                  </CCol>
                </CRow>
              )}

              <CTable
                hover
                responsive
                striped
                bordered
                className="shadow-sm align-middle"
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}
              >
                <CTableHead color="dark">
                  <CTableRow>
                    {showDetailView ? (
                      <>
                        <CTableHeaderCell className="text-center fw-bold">Booking ID</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Date</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Slot</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Court</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Duration</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Players</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Amount (₹)</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Checked-In Time</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Status</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Actions</CTableHeaderCell>
                      </>
                    ) : (
                      <>
                        <CTableHeaderCell className="text-center fw-bold">WhatsApp</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Checked-In Count</CTableHeaderCell>
                        <CTableHeaderCell className="text-center fw-bold">Actions</CTableHeaderCell>
                      </>
                    )}
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {showDetailView ? (
                    getDetailViewBookings().length > 0 ? (
                      getDetailViewBookings().map((b) => (
                        <CTableRow key={b._id} style={{ cursor: 'pointer', textAlign: 'center' }}>
                          <CTableDataCell className="text-center">{b.bookingId}</CTableDataCell>
                          <CTableDataCell className="text-center">{b.date}</CTableDataCell>
                          <CTableDataCell className="text-center">{b.slot}</CTableDataCell>
                          <CTableDataCell className="text-center">{b.courtName}</CTableDataCell>
                          <CTableDataCell className="text-center">{b.duration}</CTableDataCell>
                          <CTableDataCell className="text-center">{b.playerCount}</CTableDataCell>
                          <CTableDataCell className="text-center fw-semibold">₹{b.amount}</CTableDataCell>
                          <CTableDataCell className="text-center">
                            {b.checkedInTime ? format(new Date(b.checkedInTime), 'dd/MM/yyyy HH:mm') : 'N/A'}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color={b.status === 'confirmed' ? 'success' : 'warning'}>
                              {b.status}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CButton
                              size="sm"
                              color="primary"
                              variant="outline"
                              onClick={() => openMessageModal(b._id)}
                            >
                              Message
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan="10" className="text-center fw-bold py-4">
                          No checked-in bookings found for this WhatsApp number.
                        </CTableDataCell>
                      </CTableRow>
                    )
                  ) : groupedByWhatsapp.filter((g) => !whatsappFilter || g.whatsapp.includes(whatsappFilter))
                    .length > 0 ? (
                    groupedByWhatsapp
                      .filter((g) => !whatsappFilter || g.whatsapp.includes(whatsappFilter))
                      .map((g) => (
                        <CTableRow key={g.whatsapp} style={{ textAlign: 'center' }}>
                          <CTableDataCell className="text-center fw-semibold">{g.whatsapp}</CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color="primary" shape="rounded-pill" className="px-3 py-2">
                              {g.count}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CButton
                              color="warning"
                              size="sm"
                              style={{ transition: '0.3s', cursor: 'pointer', color: 'white' }}
                              onClick={() => viewBookingsByWhatsapp(g.whatsapp)}
                            >
                              View Details
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="3" className="text-center fw-bold py-4">
                        No checked-in users found.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Send Message</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormTextarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message..."
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={sendMessage}>
            Send
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default CheckedIns
