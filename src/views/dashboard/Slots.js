import React, { useEffect, useState } from "react";
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
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CTooltip,
  CProgress
} from '@coreui/react';
import api from '../../api';
import Swal from 'sweetalert2';
import CIcon from '@coreui/icons-react';
import { cilPeople } from '@coreui/icons';

const Slots = () => {
  const [list, setList] = useState([]);
  const [courts, setCourts] = useState([]);
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Active");
  const [date, setDate] = useState("");
  const [courtId, setCourtId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterCourt, setFilterCourt] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [courtAvailability, setCourtAvailability] = useState({});
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  async function loadCourts() {
    try {
      const response = await api.get('/api/admin/courts');
      setCourts(response.data);
    } catch (error) {
      console.error("Error loading courts:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load courts. Please try again.'
      });
    }
  }

  async function loadSlots() { 
    try {
      let url = '/api/admin/slots';
      const params = new URLSearchParams();
      
      if (filterDate) params.append('date', filterDate);
      if (filterCourt) params.append('courtId', filterCourt);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await api.get(url); 
      // Add default status if not present
      const updatedSlots = response.data.map(slot => ({
        ...slot,
        status: slot.status || 'Active'
      }));
      setList(updatedSlots); 
    } catch (error) {
      console.error("Error loading slots:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load time slots. Please try again.'
      });
    }
  }

  useEffect(() => { 
    loadCourts();
    loadSlots(); 
  }, []);

  useEffect(() => {
    loadSlots();
  }, [filterDate, filterCourt]);
  
  async function checkSlotAvailability(slotId) {
    if (!filterDate) return;
    
    try {
      setSelectedSlotId(slotId);
      const response = await api.get(`/api/admin/slots/availability?date=${filterDate}&slotId=${slotId}`);
      setCourtAvailability(response.data);
    } catch (error) {
      console.error("Error checking slot availability:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to check time slot availability. Please try again.'
      });
    }
  }

  async function addSlot() { 
    try {
      if (!time) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please enter a time slot.'
        });
        return;
      }
      
      await api.post('/api/admin/slots', { 
        time, 
        price, 
        status,
        date: date || undefined,
        courtId: courtId || undefined
      }); 
      
      resetForm();
      loadSlots();
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Time slot added successfully!'
      });
    } catch (error) {
      console.error("Error adding slot:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add time slot. Please try again.'
      });
    }
  }

  async function updateSlot() {
    try {
      await api.put(`/api/admin/slots/${currentSlot._id}`, { 
        time, 
        price, 
        status,
        date: date || undefined,
        courtId: courtId || undefined
      });
      
      resetForm();
      setShowModal(false);
      loadSlots();
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Time slot updated successfully!'
      });
    } catch (error) {
      console.error("Error updating slot:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update time slot. Please try again.'
      });
    }
  }

  async function removeSlot(id) { 
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });
      
      if (result.isConfirmed) {
        await api.delete('/api/admin/slots/' + id); 
        loadSlots();
        
        Swal.fire(
          'Deleted!',
          'Time slot has been deleted.',
          'success'
        );
      }
    } catch (error) {
      console.error("Error removing slot:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete time slot. Please try again.'
      });
    }
  }
  
  function editSlot(slot) {
    setCurrentSlot(slot);
    setTime(slot.time);
    setPrice(slot.price);
    setStatus(slot.status || 'Active');
    setDate(slot.date || '');
    setCourtId(slot.courtId || '');
    setShowModal(true);
  }
  
  function resetForm() {
    setTime('');
    setPrice('');
    setStatus('Active');
    setDate('');
    setCourtId('');
    setCurrentSlot(null);
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Time Slots Management</strong>
          </CCardHeader>
          <CCardBody>
            {/* Add Time Slot Form */}
            <CForm className="row g-3 mb-4">
              <CCol md={4}>
                <CFormInput 
                  placeholder="Time Slot (e.g. 9:00 AM - 10:00 AM)" 
                  value={time} 
                  onChange={e => setTime(e.target.value)}
                  label="Time Slot"
                />
              </CCol>
              <CCol md={3}>
                <CFormInput 
                  placeholder="Price" 
                  type="number"
                  value={price} 
                  onChange={e => setPrice(e.target.value)}
                  label="Price (₹)"
                />
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  label="Status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </CFormSelect>
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <CButton color="primary" onClick={addSlot} className="px-4">Add Time Slot</CButton>
              </CCol>
            </CForm>

            {/* Filters */}
            {/* <CCard className="mb-4">
              <CCardHeader>
                <strong>Filter Slots</strong>
              </CCardHeader>
              <CCardBody>
                <CForm className="row g-3">
                  <CCol md={6}>
                    <CFormInput 
                      type="date"
                      value={filterDate} 
                      onChange={e => setFilterDate(e.target.value)}
                      label="Filter by Date"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormSelect
                      label="Filter by Court"
                      value={filterCourt}
                      onChange={e => setFilterCourt(e.target.value)}
                    >
                      <option value="">All Courts</option>
                      {courts.map(court => (
                        <option key={court._id} value={court._id}>
                          {court.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol> 
                </CForm>
              </CCardBody>
            </CCard> */}

            {/* Slots Table */}
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">Time Slot</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Price (₹)</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                  {/* <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Court</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Availability</CTableHeaderCell> */}
                  <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {list.map(slot => (
                  <CTableRow key={slot._id}>
                    <CTableDataCell>{slot.time}</CTableDataCell>
                    <CTableDataCell>₹{slot.price}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={slot.status === 'Active' ? 'success' : 'danger'}>
                        {slot.status || 'Active'}
                      </CBadge>
                    </CTableDataCell>
                    {/* <CTableDataCell>{slot.date || 'All Dates'}</CTableDataCell>
                    <CTableDataCell>
                      {slot.courtId ? 
                        courts.find(c => c._id === slot.courtId)?.name || 'Unknown Court' 
                        : 'All Courts'}
                    </CTableDataCell> */}
                    {/* <CTableDataCell>
                      {selectedSlotId === slot._id && courtAvailability.courts ? (
                        <div>
                          {courtAvailability.courts.map(court => (
                            <div key={court.courtId} className="mb-2">
                              <div className="d-flex align-items-center mb-1">
                                <small>{court.courtName}</small>
                                <CIcon icon={cilPeople} size="sm" className="ms-2 me-1" />
                                <small>{court.bookedCapacity}/{court.totalCapacity}</small>
                              </div>
                              <CTooltip content={`${court.availableCapacity} spots available`}>
                                <CProgress value={(court.bookedCapacity/court.totalCapacity)*100} color={court.isAvailable ? "success" : "danger"} height={5} />
                              </CTooltip>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <CButton 
                          color="info" 
                          size="sm"
                          onClick={() => checkSlotAvailability(slot._id)}
                          disabled={!filterDate}
                        >
                          Check
                        </CButton>
                      )}
                    </CTableDataCell> */}
                    <CTableDataCell>
                      <CButton 
                        color="info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => editSlot(slot)}
                      >
                        Edit
                      </CButton>
                      <CButton 
                        color="danger" 
                        size="sm" 
                        onClick={() => removeSlot(slot._id)}
                      >
                        Delete
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Edit Slot Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Edit Time Slot</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput 
              label="Time Slot"
              placeholder="Time Slot (e.g. 9:00 AM - 10:00 AM)" 
              value={time} 
              onChange={e => setTime(e.target.value)}
              className="mb-3"
            />
            <CFormInput 
              label="Price (₹)"
              placeholder="Price" 
              type="number"
              value={price} 
              onChange={e => setPrice(e.target.value)}
              className="mb-3"
            />
            <CFormSelect
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mb-3"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </CFormSelect>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={updateSlot}>
            Save Changes
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  );
};

export default Slots;