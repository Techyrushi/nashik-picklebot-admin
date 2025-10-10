import React, { useState, useEffect } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CCardFooter,
  CProgress,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CFormSelect,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CAlert,
  CSpinner,
  CWidgetStatsF,
  CWidgetStatsC,
  CWidgetStatsE
} from '@coreui/react'
import { Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import {
  cilCalendar,
  cilClock,
  cilBasket,
  cilMoney,
  cilList,
  cilChart,
  cilUser,
  cilCheckCircle,
  cilWarning,
  cilXCircle,
  cilArrowTop,
  cilArrowBottom,
  cilFilter,
  cilReload
} from '@coreui/icons'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Preloader from 'src/components/Preloader.js'
import Swal from 'sweetalert2'
import api from '../../api'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isToday,
  isThisWeek,
  isThisMonth
} from 'date-fns'

// Configure axios defaults
axios.defaults.baseURL = window.location.origin

const NashikPicklersDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeCourts: 0,
    activeSlots: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    checkedInBookings: 0,
    todayBookings: 0,
    todayRevenue: 0,
    weeklyBookings: 0,
    monthlyBookings: 0
  })
  const [analytics, setAnalytics] = useState({
    revenueTrend: [],
    bookingsTrend: [],
    courtUtilization: [],
    peakHours: [],
    recentBookings: [],
    topCourts: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('today') // today, week, month, year
  const [activeTab, setActiveTab] = useState('overview') // overview, analytics, performance
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      let bookings = []
      let courts = []
      let slots = []

      try {
        // Fetch bookings
        const bookingsResponse = await api.get('/api/admin/bookings')
        bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []
      } catch (error) {
        console.error('Error fetching bookings:', error)
        bookings = []
      }

      try {
        // Fetch courts
        const courtsResponse = await api.get('/api/admin/courts')
        const allCourts = Array.isArray(courtsResponse.data) ? courtsResponse.data : []
        courts = allCourts.filter((slot) => slot.status === 'Active')
      } catch (error) {
        console.error('Error fetching courts:', error)
        courts = []
      }

      try {
        const slotsResponse = await api.get('/api/admin/slots')
        const allSlots = Array.isArray(slotsResponse.data) ? slotsResponse.data : []
        slots = allSlots.filter((slot) => slot.status === 'Active')
      } catch (error) {
        console.error('Error fetching slots:', error)
        slots = []
      }

      // Calculate comprehensive statistics
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')

      const todayBookings = bookings.filter(booking =>
        booking.date === todayStr && booking.status === 'confirmed'
      )
      const todayRevenue = todayBookings.reduce((sum, booking) =>
        sum + (Number(booking.amount) || 0), 0
      )

      const weeklyBookings = bookings.filter(booking =>
        isThisWeek(parseISO(booking.date)) && booking.status === 'confirmed'
      ).length

      const monthlyBookings = bookings.filter(booking =>
        isThisMonth(parseISO(booking.date)) && booking.status === 'confirmed'
      ).length

      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
      const pendingBookings = bookings.filter(b => b.status === 'pending_payment').length
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
      const checkedInBookings = bookings.filter(b => b.checkedIn === true).length

      let totalRevenue = 0
      if (bookings && bookings.length > 0) {
        bookings.forEach((booking) => {
          if (booking && booking.amount && booking.status === 'confirmed') {
            totalRevenue += Number(booking.amount)
          }
        })
      }

      // Calculate analytics data
      const analyticsData = calculateAnalytics(bookings, courts, timeRange)

      setStats({
        totalBookings: bookings.length,
        totalRevenue,
        activeCourts: courts.length,
        activeSlots: slots.length,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        checkedInBookings,
        todayBookings: todayBookings.length,
        todayRevenue,
        weeklyBookings,
        monthlyBookings
      })

      setAnalytics(analyticsData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      Swal.fire({
        title: 'Error',
        text: 'Failed to load dashboard data. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (bookings, courts, range) => {
    // Revenue trend (last 7 days)
    const revenueTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayRevenue = bookings
        .filter(b => b.status === 'confirmed' && b.date === dateStr)
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
      revenueTrend.push({
        date: format(date, 'MMM dd'),
        revenue: dayRevenue
      })
    }

    // Bookings trend
    const bookingsTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayBookings = bookings.filter(b => b.date === dateStr).length
      bookingsTrend.push({
        date: format(date, 'MMM dd'),
        bookings: dayBookings
      })
    }

    // Court utilization
    const courtUtilization = courts.map(court => {
      const courtBookings = bookings.filter(b =>
        b.courtId === court._id && b.status === 'confirmed'
      ).length
      return {
        court: court.name,
        utilization: (courtBookings / 30) * 100, // Assuming 30 max bookings per court
        bookings: courtBookings
      }
    }).sort((a, b) => b.utilization - a.utilization)

    // Peak hours analysis
    const hourCounts = {}
    bookings
      .filter(b => b.status === 'confirmed')
      .forEach(booking => {
        if (booking.slot) {
          const hour = booking.slot.split(':')[0]
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
        }
      })

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))

    // Recent bookings
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    // Top courts by revenue
    const courtRevenue = {}
    bookings
      .filter(b => b.status === 'confirmed')
      .forEach(booking => {
        const courtName = booking.courtName || 'Unknown Court'
        courtRevenue[courtName] = (courtRevenue[courtName] || 0) + (Number(booking.amount) || 0)
      })

    const topCourts = Object.entries(courtRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([court, revenue]) => ({ court, revenue }))

    return {
      revenueTrend,
      bookingsTrend,
      courtUtilization,
      peakHours,
      recentBookings,
      topCourts
    }
  }

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const refreshData = () => {
    fetchDashboardData()
    Swal.fire({
      title: 'Refreshing...',
      text: 'Updating dashboard data',
      icon: 'info',
      timer: 1000,
      showConfirmButton: false
    })
  }

  if (loading) {
    return <Preloader />
  }

  const renderOverviewTab = () => (
    <>
      {/* Key Metrics Row */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-4"
            color="primary"
            icon={<CIcon icon={cilCalendar} height={24} />}
            title="Total Bookings"
            value={stats.totalBookings.toString()}
            footer={
              <div className="d-flex justify-content-between">
                <small>Confirmed: {stats.confirmedBookings}</small>
                <small className={`text-${stats.confirmedBookings > 0 ? 'success' : 'secondary'}`}>
                  {((stats.confirmedBookings / stats.totalBookings) * 100 || 0).toFixed(1)}%
                </small>
              </div>
            }
          />
        </CCol>

        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-4"
            color="success"
            icon={<CIcon icon={cilMoney} height={24} />}
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            footer={
              <div className="d-flex justify-content-between">
                <small>Today: ₹{stats.todayRevenue.toLocaleString()}</small>
                <small className="text-success">
                  +{getPercentageChange(stats.todayRevenue, 0).toFixed(1)}%
                </small>
              </div>
            }
          />
        </CCol>

        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-4"
            color="info"
            icon={<CIcon icon={cilBasket} height={24} />}
            title="Active Courts"
            value={stats.activeCourts.toString()}
            footer={
              <div className="d-flex justify-content-between">
                <small>Utilization</small>
                <small className="text-info">
                  {analytics.courtUtilization.length > 0 ?
                    (analytics.courtUtilization.reduce((sum, court) => sum + court.utilization, 0) / analytics.courtUtilization.length).toFixed(1) : 0
                  }%
                </small>
              </div>
            }
          />
        </CCol>

        <CCol sm={6} lg={3}>
          <CWidgetStatsF
            className="mb-4"
            color="warning"
            icon={<CIcon icon={cilCheckCircle} height={24} />}
            title="Checked In"
            value={stats.checkedInBookings.toString()}
            footer={
              <div className="d-flex justify-content-between">
                <small>Check-in Rate</small>
                <small className="text-warning">
                  {((stats.checkedInBookings / stats.confirmedBookings) * 100 || 0).toFixed(1)}%
                </small>
              </div>
            }
          />
        </CCol>
      </CRow>

      {/* Performance Metrics Row */}
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Today's Performance</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <span>Bookings:</span>
                <strong>{stats.todayBookings}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Revenue:</span>
                <strong>₹{stats.todayRevenue.toLocaleString()}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Avg. Value:</span>
                <strong>₹{(stats.todayRevenue / (stats.todayBookings || 1)).toFixed(2)}</strong>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Booking Status</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <span>
                  <CBadge color="success">Confirmed</CBadge>
                </span>
                <strong>{stats.confirmedBookings}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>
                  <CBadge color="warning">Pending</CBadge>
                </span>
                <strong>{stats.pendingBookings}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>
                  <CBadge color="danger">Cancelled</CBadge>
                </span>
                <strong>{stats.cancelledBookings}</strong>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Weekly Summary</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <span>This Week:</span>
                <strong>{stats.weeklyBookings}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>This Month:</span>
                <strong>{stats.monthlyBookings}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Conversion Rate:</span>
                <strong>
                  {((stats.confirmedBookings / stats.totalBookings) * 100 || 0).toFixed(1)}%
                </strong>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )

  const renderAnalyticsTab = () => (
    <CRow>
      <CCol lg={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Revenue Trend (Last 7 Days)</strong>
          </CCardHeader>
          <CCardBody>
            {analytics.revenueTrend.map((trend, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>{trend.date}</span>
                  <span>₹{trend.revenue.toLocaleString()}</span>
                </div>
                <CProgress
                  value={(trend.revenue / Math.max(...analytics.revenueTrend.map(t => t.revenue))) * 100}
                  color="success"
                  size="sm"
                />
              </div>
            ))}
          </CCardBody>
        </CCard>

        <CCard className="mb-4">
          <CCardHeader>
            <strong>Top Performing Courts</strong>
          </CCardHeader>
          <CCardBody>
            {analytics.topCourts.map((court, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>{court.court}</span>
                  <span>₹{court.revenue.toLocaleString()}</span>
                </div>
                <CProgress
                  value={(court.revenue / Math.max(...analytics.topCourts.map(c => c.revenue))) * 100}
                  color="primary"
                  size="sm"
                />
              </div>
            ))}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Court Utilization</strong>
          </CCardHeader>
          <CCardBody>
            {analytics.courtUtilization.slice(0, 5).map((court, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>{court.court}</span>
                  <span>{court.utilization.toFixed(1)}%</span>
                </div>
                <CProgress
                  value={court.utilization}
                  color={court.utilization > 80 ? 'success' : court.utilization > 50 ? 'warning' : 'danger'}
                  size="sm"
                />
              </div>
            ))}
          </CCardBody>
        </CCard>

        <CCard className="mb-4">
          <CCardHeader>
            <strong>Peak Booking Hours</strong>
          </CCardHeader>
          <CCardBody>
            {analytics.peakHours.map((peak, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>{peak.hour}</span>
                  <span>{peak.count} bookings</span>
                </div>
                <CProgress
                  value={(peak.count / Math.max(...analytics.peakHours.map(p => p.count))) * 100}
                  color="info"
                  size="sm"
                />
              </div>
            ))}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )

  const renderPerformanceTab = () => (
    <CRow>
      <CCol lg={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Recent Bookings</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Booking ID</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Court</CTableHeaderCell>
                  <CTableHeaderCell>Amount</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {analytics.recentBookings.map((booking) => (
                  <CTableRow key={booking._id}>
                    <CTableDataCell>{booking.bookingId}</CTableDataCell>
                    <CTableDataCell>{booking.date}</CTableDataCell>
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
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={4}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Quick Stats</strong>
          </CCardHeader>
          <CCardBody>
            <div className="mb-3">
              <small className="text-muted">Avg. Booking Value</small>
              <div className="fw-bold fs-5">
                ₹{(stats.totalRevenue / (stats.confirmedBookings || 1)).toFixed(2)}
              </div>
            </div>
            <div className="mb-3">
              <small className="text-muted">Check-in Rate</small>
              <div className="fw-bold fs-5">
                {((stats.checkedInBookings / stats.confirmedBookings) * 100 || 0).toFixed(1)}%
              </div>
            </div>
            <div className="mb-3">
              <small className="text-muted">Cancellation Rate</small>
              <div className="fw-bold fs-5">
                {((stats.cancelledBookings / stats.totalBookings) * 100 || 0).toFixed(1)}%
              </div>
            </div>
            <div className="mb-3">
              <small className="text-muted">Weekly Growth</small>
              <div className="fw-bold fs-5 text-success">
                +{getPercentageChange(stats.weeklyBookings, 0).toFixed(1)}%
              </div>
            </div>
          </CCardBody>
        </CCard>

        <CCard className="mb-4">
          <CCardHeader>
            <strong>System Status</strong>
          </CCardHeader>
          <CCardBody>
            <div className="d-flex justify-content-between mb-2">
              <span>Courts Active</span>
              <CBadge color="success">{stats.activeCourts}/{(stats.activeCourts + 2)}</CBadge>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Slots Available</span>
              <CBadge color="info">{stats.activeSlots}</CBadge>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>API Status</span>
              <CBadge color="success">Online</CBadge>
            </div>
            <div className="d-flex justify-content-between">
              <span>Last Updated</span>
              <small className="text-muted">{format(new Date(), 'HH:mm:ss')}</small>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">NashikPicklers Analytics Dashboard</h4>
            <div className="d-flex gap-2">
              <CFormSelect
                size="sm"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{ width: '120px' }}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </CFormSelect>
              <CButton color="primary" size="sm" onClick={refreshData}>
                <CIcon icon={cilReload} className="me-1" />
                Refresh
              </CButton>
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Navigation Tabs */}
          <CNav variant="tabs" className="mb-4">
            <CNavItem>
              <CNavLink
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilChart} className="me-2" />
                Overview
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilCalendar} className="me-2" />
                Analytics
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'performance'}
                onClick={() => setActiveTab('performance')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilList} className="me-2" />
                Performance
              </CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent>
            <CTabPane visible={activeTab === 'overview'}>
              {renderOverviewTab()}
            </CTabPane>
            <CTabPane visible={activeTab === 'analytics'}>
              {renderAnalyticsTab()}
            </CTabPane>
            <CTabPane visible={activeTab === 'performance'}>
              {renderPerformanceTab()}
            </CTabPane>
          </CTabContent>

          {/* Quick Actions */}
          <CCard className="mb-4">
            <CCardHeader>
              <h5>Quick Actions</h5>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol md={3} className="mb-3">
                  <Link to="/courts" className="text-decoration-none">
                    <CButton color="primary" className="d-block w-100">
                      <CIcon icon={cilBasket} className="me-2" />
                      Manage Courts
                    </CButton>
                  </Link>
                </CCol>
                <CCol md={3} className="mb-3">
                  <Link to="/slots" className="text-decoration-none">
                    <CButton color="info" className="d-block w-100">
                      <CIcon icon={cilClock} className="me-2" />
                      Manage Slots
                    </CButton>
                  </Link>
                </CCol>
                <CCol md={3} className="mb-3">
                  <Link to="/bookings" className="text-decoration-none">
                    <CButton color="success" className="d-block w-100">
                      <CIcon icon={cilList} className="me-2" />
                      View Bookings
                    </CButton>
                  </Link>
                </CCol>
                <CCol md={3} className="mb-3">
                  <Link to="/reports" className="text-decoration-none">
                    <CButton color="warning" className="d-block w-100">
                      <CIcon icon={cilChart} className="me-2" />
                      Reports
                    </CButton>
                  </Link>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCardBody>
        <CCardFooter>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Last updated: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
            </small>
            <small className="text-muted">
              Showing data for: {timeRange}
            </small>
          </div>
        </CCardFooter>
      </CCard>
    </>
  )
}

export default NashikPicklersDashboard
