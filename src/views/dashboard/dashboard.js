import React, { useState, useEffect } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CCardFooter,
} from '@coreui/react';
import { Link } from 'react-router-dom';
import CIcon from '@coreui/icons-react';
import {
  cilCalendar,
  cilClock,
  cilBasket,
  cilDollar,
  cilPlus,
  cilList,
} from '@coreui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Preloader from 'src/components/Preloader.js';
import Swal from 'sweetalert2';

// Configure axios defaults
axios.defaults.baseURL = window.location.origin;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeCourts: 0,
    activeSlots: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let bookings = [];
        let courts = [];
        let slots = [];
        
        try {
          // Fetch bookings
          const bookingsResponse = await axios.get('/api/admin/bookings');
          bookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
        } catch (error) {
          console.error('Error fetching bookings:', error);
        }
        
        try {
          // Fetch courts
          const courtsResponse = await axios.get('/api/admin/courts');
          courts = Array.isArray(courtsResponse.data) ? courtsResponse.data : [];
        } catch (error) {
          console.error('Error fetching courts:', error);
        }
        
        try {
          // Fetch slots
          const slotsResponse = await axios.get('/api/admin/slots');
          slots = Array.isArray(slotsResponse.data) ? slotsResponse.data : [];
        } catch (error) {
          console.error('Error fetching slots:', error);
        }
        
        // Calculate total revenue from bookings
        let revenue = 0;
        if (bookings.length > 0) {
          bookings.forEach(booking => {
            if (booking && booking.amount) {
              revenue += Number(booking.amount);
            }
          });
        }
        
        // Ensure we have valid numbers for all stats
        const totalBookings = bookings.length || 0;
        const totalRevenue = isNaN(revenue) ? 0 : revenue;
        const activeCourts = courts.length || 0;
        const activeSlots = slots.length || 0;
        
        console.log('Setting stats:', {
          totalBookings,
          totalRevenue,
          activeCourts,
          activeSlots,
        });
        
        setStats({
          totalBookings,
          totalRevenue,
          activeCourts,
          activeSlots,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values on error
        setStats({
          totalBookings: 0,
          totalRevenue: 0,
          activeCourts: 0,
          activeSlots: 0,
        });
        
        Swal.fire({
          title: 'Error',
          text: 'Failed to load dashboard data. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <h4>NashikPicklers Dashboard</h4>
        </CCardHeader>
        <CCardBody>
          <CRow>
            <CCol sm={6} lg={3}>
              <CCard className="mb-4 text-white bg-primary">
                <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fs-4 fw-semibold">
                      {stats.totalBookings}
                      <span className="fs-6 fw-normal ms-2">
                        bookings
                      </span>
                    </div>
                    <div>Total Bookings</div>
                  </div>
                  <div className="dropdown">
                    <CIcon icon={cilCalendar} size="xl" />
                  </div>
                </CCardBody>
                <CCardFooter className="d-flex align-items-center justify-content-between">
                  <Link to="/bookings" className="text-white text-decoration-none">
                    View all bookings
                  </Link>
                </CCardFooter>
              </CCard>
            </CCol>

            <CCol sm={6} lg={3}>
              <CCard className="mb-4 text-white bg-success">
                <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fs-4 fw-semibold">
                      ${stats.totalRevenue.toFixed(2)}
                    </div>
                    <div>Total Revenue</div>
                  </div>
                  <div className="dropdown">
                    <CIcon icon={cilDollar} size="xl" />
                  </div>
                </CCardBody>
                <CCardFooter className="d-flex align-items-center justify-content-between">
                  <span className="text-white">From all bookings</span>
                </CCardFooter>
              </CCard>
            </CCol>

            <CCol sm={6} lg={3}>
              <CCard className="mb-4 text-white bg-info">
                <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fs-4 fw-semibold">
                      {stats.activeCourts}
                      <span className="fs-6 fw-normal ms-2">
                        courts
                      </span>
                    </div>
                    <div>Active Courts</div>
                  </div>
                  <div className="dropdown">
                    <CIcon icon={cilBasket} size="xl" />
                  </div>
                </CCardBody>
                <CCardFooter className="d-flex align-items-center justify-content-between">
                  <Link to="/courts" className="text-white text-decoration-none">
                    Manage courts
                  </Link>
                </CCardFooter>
              </CCard>
            </CCol>

            <CCol sm={6} lg={3}>
              <CCard className="mb-4 text-white bg-warning">
                <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fs-4 fw-semibold">
                      {stats.activeSlots}
                      <span className="fs-6 fw-normal ms-2">
                        slots
                      </span>
                    </div>
                    <div>Active Time Slots</div>
                  </div>
                  <div className="dropdown">
                    <CIcon icon={cilClock} size="xl" />
                  </div>
                </CCardBody>
                <CCardFooter className="d-flex align-items-center justify-content-between">
                  <Link to="/slots" className="text-white text-decoration-none">
                    Manage time slots
                  </Link>
                </CCardFooter>
              </CCard>
            </CCol>
          </CRow>

          <CCard className="mb-4">
            <CCardHeader>
              <h5>Quick Actions</h5>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol md={4} className="mb-3">
                  <Link to="/courts">
                    <CButton color="primary" className="d-block w-100">
                      <CIcon icon={cilBasket} className="me-2" />
                      Manage Courts
                    </CButton>
                  </Link>
                </CCol>
                <CCol md={4} className="mb-3">
                  <Link to="/slots">
                    <CButton color="info" className="d-block w-100">
                      <CIcon icon={cilClock} className="me-2" />
                      Manage Time Slots
                    </CButton>
                  </Link>
                </CCol>
                <CCol md={4} className="mb-3">
                  <Link to="/bookings">
                    <CButton color="success" className="d-block w-100">
                      <CIcon icon={cilList} className="me-2" />
                      View Bookings
                    </CButton>
                  </Link>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCardBody>
      </CCard>
    </>
  );
};

export default Dashboard;