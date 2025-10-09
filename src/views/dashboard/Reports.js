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
  CProgress,
  CCardFooter,
  CSpinner,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilChart, cilFilter, cilReload } from '@coreui/icons'
import api from '../../api'
import Swal from 'sweetalert2'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
} from 'date-fns'

const Reports = () => {
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [visible, setVisible] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [message, setMessage] = useState('')

  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [courtFilter, setCourtFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [whatsappFilter, setWhatsappFilter] = useState('')
  const [checkedInFilter, setCheckedInFilter] = useState('') // New filter for checkedIn status

  // View and display states
  const [courts, setCourts] = useState([])
  const [viewMode, setViewMode] = useState('detailed') // detailed, summary, analytics
  const [groupBy, setGroupBy] = useState('none') // none, court, status, date, whatsapp, checkedIn
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    checkedInBookings: 0, // New analytics field
    averageBookingValue: 0,
    bookingsByCourt: {},
    bookingsByStatus: {},
    bookingsByCheckedIn: {}, // New analytics field
    revenueTrend: [],
    peakHours: []
  })

  // Load courts
  async function loadCourts() {
    try {
      const response = await api.get('/api/admin/courts')
      setCourts(response.data)
    } catch (error) {
      console.error('Error loading courts:', error)
    }
  }

  // Load bookings
  async function loadBookings() {
    setLoading(true)
    try {
      const response = await api.get('/api/admin/bookings')
      setBookings(response.data)
      applyFilters(response.data)
      calculateAnalytics(response.data)

      Swal.fire({
        icon: 'success',
        title: 'Data Loaded',
        text: `Successfully loaded ${response.data.length} bookings`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Error loading bookings:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load bookings. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Initialize with default date range (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = subDays(end, 30)
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))

    loadCourts()
    loadBookings()
  }, [])

  // Calculate analytics
  function calculateAnalytics(bookingsData) {
    const filtered = applyFiltersToData(bookingsData)

    const totalBookings = filtered.length
    const confirmedBookings = filtered.filter(b => b.status === 'confirmed').length
    const pendingBookings = filtered.filter(b => b.status === 'pending_payment').length
    const cancelledBookings = filtered.filter(b => b.status === 'cancelled').length
    const checkedInBookings = filtered.filter(b => b.checkedIn === true).length // New analytics calculation

    // Calculate total revenue only from confirmed bookings
    const totalRevenue = filtered
      .filter(b => b.status === 'confirmed')
      .reduce((sum, booking) => sum + (parseFloat(booking.amount) || 0), 0)

    // Calculate average booking value only from confirmed bookings
    const averageBookingValue = confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0

    // Bookings by court (only confirmed for revenue-related calculations)
    const bookingsByCourt = {}
    const revenueByCourt = {}

    filtered.forEach(booking => {
      const courtName = booking.courtName || 'Unknown Court'

      // Count all bookings for this court
      bookingsByCourt[courtName] = (bookingsByCourt[courtName] || 0) + 1

      // Calculate revenue only for confirmed bookings
      if (booking.status === 'confirmed') {
        revenueByCourt[courtName] = (revenueByCourt[courtName] || 0) + (parseFloat(booking.amount) || 0)
      }
    })

    // Bookings by status
    const bookingsByStatus = {}
    filtered.forEach(booking => {
      bookingsByStatus[booking.status] = (bookingsByStatus[booking.status] || 0) + 1
    })

    // Bookings by checkedIn status - New analytics calculation
    const bookingsByCheckedIn = {
      checkedIn: filtered.filter(b => b.checkedIn === true).length,
      notCheckedIn: filtered.filter(b => b.checkedIn !== true).length
    }

    // Revenue trend (last 7 days) - only confirmed bookings
    const revenueTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayRevenue = filtered
        .filter(b => b.status === 'confirmed' && b.date === dateStr)
        .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
      revenueTrend.push({
        date: dateStr,
        revenue: dayRevenue
      })
    }

    // Peak hours analysis (only confirmed bookings)
    const hourCounts = {}
    filtered
      .filter(b => b.status === 'confirmed')
      .forEach(booking => {
        if (booking.slot) {
          const hour = booking.slot.split(':')[0]
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
        }
      })

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))

    setAnalytics({
      totalBookings,
      totalRevenue,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      checkedInBookings, // Added to analytics
      averageBookingValue,
      bookingsByCourt,
      revenueByCourt,
      bookingsByStatus,
      bookingsByCheckedIn, // Added to analytics
      revenueTrend,
      peakHours
    })
  }

  // Apply filters to data
  function applyFiltersToData(data) {
    let filtered = [...data]

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter((booking) => {
        if (!booking.date) return false
        const bookingDate = booking.date.split('T')[0]
        return bookingDate >= startDate && bookingDate <= endDate
      })
    }

    // Court filter
    if (courtFilter) {
      filtered = filtered.filter((booking) => booking.courtId === courtFilter)
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    // WhatsApp filter
    if (whatsappFilter) {
      filtered = filtered.filter(
        (booking) => booking.whatsapp && booking.whatsapp.includes(whatsappFilter),
      )
    }

    // CheckedIn filter - New filter implementation
    if (checkedInFilter !== '') {
      if (checkedInFilter === 'checkedIn') {
        filtered = filtered.filter((booking) => booking.checkedIn === true)
      } else if (checkedInFilter === 'notCheckedIn') {
        filtered = filtered.filter((booking) => booking.checkedIn !== true)
      }
    }

    return filtered
  }

  // Apply filters
  function applyFilters(data) {
    const filtered = applyFiltersToData(data)
    setFilteredBookings(filtered)
    calculateAnalytics(data)
  }

  // Handle filter changes
  useEffect(() => {
    applyFilters(bookings)
  }, [startDate, endDate, courtFilter, statusFilter, whatsappFilter, checkedInFilter, bookings])

  // Group data based on groupBy selection
  function getGroupedData() {
    const grouped = {}

    filteredBookings.forEach(booking => {
      let key

      switch (groupBy) {
        case 'court':
          key = booking.courtName || 'Unknown Court'
          break
        case 'status':
          key = booking.status
          break
        case 'date':
          key = booking.date
          break
        case 'whatsapp':
          key = booking.whatsapp || 'Unknown'
          break
        case 'checkedIn': // New grouping option
          key = booking.checkedIn === true ? 'Checked In' : 'Not Checked In'
          break
        default:
          return
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(booking)
    })

    return grouped
  }

  // Export functionality
  async function exportReports() {
    setExportLoading(true)
    try {
      let csvContent = ''
      let filename = ''

      if (viewMode === 'analytics') {
        // Export analytics data
        csvContent = 'Metric,Value\n'
        csvContent += `Total Bookings,${analytics.totalBookings}\n`
        csvContent += `Total Revenue,${analytics.totalRevenue}\n`
        csvContent += `Confirmed Bookings,${analytics.confirmedBookings}\n`
        csvContent += `Pending Bookings,${analytics.pendingBookings}\n`
        csvContent += `Cancelled Bookings,${analytics.cancelledBookings}\n`
        csvContent += `Checked In Bookings,${analytics.checkedInBookings}\n` // Added to export
        csvContent += `Average Booking Value,${analytics.averageBookingValue.toFixed(2)}\n\n`

        csvContent += 'Court,Bookings\n'
        Object.entries(analytics.bookingsByCourt).forEach(([court, count]) => {
          csvContent += `${court},${count}\n`
        })

        csvContent += '\nStatus,Count\n'
        Object.entries(analytics.bookingsByStatus).forEach(([status, count]) => {
          csvContent += `${status},${count}\n`
        })

        csvContent += '\nChecked In Status,Count\n' // Added to export
        Object.entries(analytics.bookingsByCheckedIn).forEach(([status, count]) => {
          const displayStatus = status === 'checkedIn' ? 'Checked In' : 'Not Checked In'
          csvContent += `${displayStatus},${count}\n`
        })

        csvContent += '\nDate,Revenue\n'
        analytics.revenueTrend.forEach(trend => {
          csvContent += `${trend.date},${trend.revenue}\n`
        })

        filename = `analytics_report_${format(new Date(), 'yyyy-MM-dd')}.csv`
      } else {
        // Export detailed bookings
        csvContent = 'Booking ID,Date,Time,Court,Duration,Amount,Status,WhatsApp,Checked In\n' // Added Checked In column

        filteredBookings.forEach((booking) => {
          const row = [
            booking.bookingId,
            booking.date,
            booking.slot,
            booking.courtName,
            booking.duration,
            booking.amount,
            booking.status,
            booking.whatsapp,
            booking.checkedIn === true ? 'Yes' : 'No' // Added Checked In data
          ].map(field => `"${field}"`).join(',')

          csvContent += row + '\n'
        })

        filename = `bookings_report_${format(new Date(), 'yyyy-MM-dd')}.csv`
      }

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: `Report exported as ${filename}`,
        timer: 3000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'Failed to export report. Please try again.',
      })
    } finally {
      setExportLoading(false)
    }
  }

  // Quick date range presets
  const quickDateRanges = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 }
  ]

  function setQuickDateRange(days) {
    const end = new Date()
    const start = days === 0 ? end : subDays(end, days)
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  // Reset all filters
  function resetFilters() {
    const end = new Date()
    const start = subDays(end, 30)
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
    setCourtFilter('')
    setStatusFilter('')
    setWhatsappFilter('')
    setCheckedInFilter('') // Reset checkedIn filter
    setGroupBy('none')
  }

  // Send message functionality
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
      console.error('Error sending message:', error)
      Swal.fire('Failed to send message!')
    }
  }

  // Render analytics view
  const renderAnalyticsView = () => (
    <div>
      {/* Key Metrics */}
      <CRow className="mb-4">
        <CCol md={2}>
          <CCard className="text-center bg-primary text-white">
            <CCardBody>
              <h4>{analytics.totalBookings}</h4>
              <small>Total Bookings</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center bg-success text-white">
            <CCardBody>
              <h4>₹{analytics.totalRevenue.toLocaleString()}</h4>
              <small>Confirmed Revenue</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center bg-info text-white">
            <CCardBody>
              <h4>{analytics.confirmedBookings}</h4>
              <small>Confirmed</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center bg-warning text-white">
            <CCardBody>
              <h4>{analytics.pendingBookings}</h4>
              <small>Pending</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center bg-danger text-white">
            <CCardBody>
              <h4>{analytics.cancelledBookings}</h4>
              <small>Cancelled</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="text-center bg-secondary text-white">
            <CCardBody>
              <h4>{analytics.checkedInBookings}</h4>
              <small>Checked In</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Additional Metrics Row */}
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="text-center bg-dark text-white">
            <CCardBody>
              <h4>₹{analytics.averageBookingValue.toFixed(2)}</h4>
              <small>Avg. Confirmed Value</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center bg-primary text-white">
            <CCardBody>
              <h4>{analytics.checkedInBookings}</h4>
              <small>Total Checked In</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center bg-warning text-white">
            <CCardBody>
              <h4>{analytics.totalBookings - analytics.checkedInBookings}</h4>
              <small>Not Checked In</small>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center bg-info text-white">
            <CCardBody>
              <h4>{analytics.totalBookings > 0 ? ((analytics.checkedInBookings / analytics.totalBookings) * 100).toFixed(1) : 0}%</h4>
              <small>Check-in Rate</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Charts and Detailed Analytics */}
      <CRow>
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Bookings by Court</strong>
            </CCardHeader>
            <CCardBody>
              {Object.entries(analytics.bookingsByCourt).map(([court, count]) => (
                <div key={court} className="mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span>{court}</span>
                    <span>{count}</span>
                  </div>
                  <CProgress
                    value={(count / analytics.totalBookings) * 100}
                    color="primary"
                  />
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Bookings by Status</strong>
            </CCardHeader>
            <CCardBody>
              {Object.entries(analytics.bookingsByStatus).map(([status, count]) => (
                <div key={status} className="mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span>
                      <CBadge color={
                        status === 'confirmed' ? 'success' :
                          status === 'pending_payment' ? 'warning' : 'danger'
                      }>
                        {status}
                      </CBadge>
                    </span>
                    <span>{count}</span>
                  </div>
                  <CProgress
                    value={(count / analytics.totalBookings) * 100}
                    color={
                      status === 'confirmed' ? 'success' :
                        status === 'pending_payment' ? 'warning' : 'danger'
                    }
                  />
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mt-4">
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Check-in Status</strong>
            </CCardHeader>
            <CCardBody>
              {Object.entries(analytics.bookingsByCheckedIn).map(([status, count]) => {
                const displayStatus = status === 'checkedIn' ? 'Checked In' : 'Not Checked In'
                const color = status === 'checkedIn' ? 'success' : 'warning'
                return (
                  <div key={status} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span>
                        <CBadge color={color}>
                          {displayStatus}
                        </CBadge>
                      </span>
                      <span>{count}</span>
                    </div>
                    <CProgress
                      value={(count / analytics.totalBookings) * 100}
                      color={color}
                    />
                  </div>
                )
              })}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Revenue Trend (Last 7 Days)</strong>
            </CCardHeader>
            <CCardBody>
              {analytics.revenueTrend.map((trend, index) => (
                <div key={index} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>{trend.date}</span>
                    <span>₹{trend.revenue.toLocaleString()}</span>
                  </div>
                  <CProgress
                    value={(trend.revenue / Math.max(...analytics.revenueTrend.map(t => t.revenue))) * 100}
                    color="success"
                  />
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mt-4">
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <strong>Peak Booking Hours</strong>
            </CCardHeader>
            <CCardBody>
              {analytics.peakHours.map((peak, index) => (
                <div key={index} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>{peak.hour}</span>
                    <span>{peak.count} bookings</span>
                  </div>
                  <CProgress
                    value={(peak.count / Math.max(...analytics.peakHours.map(p => p.count))) * 100}
                    color="info"
                  />
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )

  // Render detailed bookings view
  const renderDetailedView = () => {
    const groupedData = getGroupedData()
    const displayData = groupBy === 'none' ? { 'All Bookings': filteredBookings } : groupedData

    return (
      <div>
        {Object.entries(displayData).map(([groupName, groupBookings]) => (
          <CCard key={groupName} className="mb-4">
            <CCardHeader>
              <strong>
                {groupName}
                {groupBy !== 'none' && ` (${groupBookings.length} bookings)`}
              </strong>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive striped>
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell>Booking ID</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Time</CTableHeaderCell>
                    <CTableHeaderCell>Court</CTableHeaderCell>
                    <CTableHeaderCell>Duration</CTableHeaderCell>
                    <CTableHeaderCell>Amount</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                    <CTableHeaderCell>Checked In</CTableHeaderCell> {/* New column */}
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {groupBookings.map((booking) => (
                    <CTableRow key={booking._id}>
                      <CTableDataCell>{booking.bookingId}</CTableDataCell>
                      <CTableDataCell>{booking.date}</CTableDataCell>
                      <CTableDataCell>{booking.slot}</CTableDataCell>
                      <CTableDataCell>{booking.courtName}</CTableDataCell>
                      <CTableDataCell>{booking.duration}</CTableDataCell>
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
                      <CTableDataCell>{booking.whatsapp}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={booking.checkedIn === true ? 'success' : 'secondary'}>
                          {booking.checkedIn === true ? 'Yes' : 'No'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingId(booking._id)
                            setVisible(true)
                          }}
                        >
                          Message
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        ))}
      </div>
    )
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Advanced Reports & Analytics</strong>
              <CButtonGroup className="float-end">
                <CButton
                  color="success"
                  size="sm"
                  onClick={exportReports}
                  disabled={exportLoading}
                >
                  {exportLoading ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} />}
                  {exportLoading ? ' Exporting...' : ' Export Report'}
                </CButton>
                <CButton color="secondary" size="sm" onClick={resetFilters}>
                  <CIcon icon={cilReload} />
                  Reset Filters
                </CButton>
              </CButtonGroup>
            </CCardHeader>
            <CCardBody>
              {/* Quick Date Range Buttons */}
              <CRow className="mb-3">
                <CCol>
                  <strong>Quick Date Range:</strong>
                  <CButtonGroup className="ms-2">
                    {quickDateRanges.map((range, index) => (
                      <CButton
                        key={index}
                        color="outline-primary"
                        size="sm"
                        onClick={() => setQuickDateRange(range.days)}
                      >
                        {range.label}
                      </CButton>
                    ))}
                  </CButtonGroup>
                </CCol>
              </CRow>

              {/* Main Filters */}
              <CRow className="mb-4">
                <CCol md={2}>
                  <CFormInput
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </CCol>
                <CCol md={2}>
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
                <CCol md={2}>
                  <CFormSelect
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="cancelled">Cancelled</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    label="Checked In"
                    value={checkedInFilter}
                    onChange={(e) => setCheckedInFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="checkedIn">Checked In</option>
                    <option value="notCheckedIn">Not Checked In</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    label="WhatsApp Number"
                    placeholder="Filter by WhatsApp"
                    value={whatsappFilter}
                    onChange={(e) => setWhatsappFilter(e.target.value)}
                  />
                </CCol>
              </CRow>

              {/* View Mode and Group By Controls */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormSelect
                    label="View Mode"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                  >
                    <option value="detailed">Detailed View</option>
                    <option value="analytics">Analytics Dashboard</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    label="Group By"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    disabled={viewMode === 'analytics'}
                  >
                    <option value="none">No Grouping</option>
                    <option value="court">Court</option>
                    <option value="status">Status</option>
                    <option value="date">Date</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="checkedIn">Checked In Status</option> {/* New grouping option */}
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Results Summary */}
              <CAlert color="info" className="mb-3">
                <strong>Results Summary:</strong> {filteredBookings.length} bookings found •
                Total Revenue: ₹{analytics.totalRevenue.toLocaleString()} •
                Checked In: {analytics.checkedInBookings} •
                Date Range: {startDate} to {endDate}
              </CAlert>

              {/* Loading Indicator */}
              {loading && (
                <div className="text-center mb-3">
                  <CSpinner />
                  <span className="ms-2">Loading data...</span>
                </div>
              )}

              {/* Main Content */}
              {viewMode === 'analytics' ? renderAnalyticsView() : renderDetailedView()}

            </CCardBody>
            <CCardFooter>
              <small className="text-muted">
                Last updated: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')} •
                Data covers period from {startDate} to {endDate} •
                Check-in Rate: {analytics.totalBookings > 0 ? ((analytics.checkedInBookings / analytics.totalBookings) * 100).toFixed(1) : 0}%
              </small>
            </CCardFooter>
          </CCard>
        </CCol>
      </CRow>

      {/* Message Modal */}
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
          <CButton color="primary" onClick={sendMessage}>
            Send Message
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Reports
