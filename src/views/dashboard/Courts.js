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
  CBadge
} from '@coreui/react';
import api from '../../api';
import Swal from 'sweetalert2';

const Courts = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Indoor");
  const [status, setStatus] = useState("Active");
  const [editMode, setEditMode] = useState(false);
  const [currentCourt, setCurrentCourt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  async function loadCourts() { 
    try {
      const response = await api.get('/api/admin/courts'); 
      // Add default type and status if not present
      const updatedCourts = response.data.map(court => ({
        ...court,
        type: court.type || 'Indoor',
        status: court.status || 'Active'
      }));
      setList(updatedCourts); 
    } catch (error) {
      console.error("Error loading courts:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load courts. Please try again.'
      });
    }
  }

  useEffect(() => { 
    loadCourts(); 
  }, []);

  async function addCourt() { 
    try {
      await api.post('/api/admin/courts', { name, price, type, status }); 
      resetForm();
      loadCourts();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Court added successfully!'
      });
    } catch (error) {
      console.error("Error adding court:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add court. Please try again.'
      });
    }
  }

  async function updateCourt() {
    try {
      await api.put(`/api/admin/courts/${currentCourt._id}`, { 
        name, 
        price, 
        type,
        status
      });
      resetForm();
      setShowModal(false);
      loadCourts();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Court updated successfully!'
      });
    } catch (error) {
      console.error("Error updating court:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update court. Please try again.'
      });
    }
  }

  async function removeCourt(id) { 
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
        await api.delete('/api/admin/courts/' + id); 
        loadCourts();
        Swal.fire(
          'Deleted!',
          'Court has been deleted.',
          'success'
        );
      }
    } catch (error) {
      console.error("Error removing court:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete court. Please try again.'
      });
    }
  }
  
  function editCourt(court) {
    setCurrentCourt(court);
    setName(court.name);
    setPrice(court.price);
    setType(court.type || 'Indoor');
    setStatus(court.status || 'Active');
    setShowModal(true);
  }
  
  function resetForm() {
    setName('');
    setPrice('');
    setType('Indoor');
    setStatus('Active');
    setCurrentCourt(null);
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Courts Management</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="row g-3 mb-4">
              <CCol md={4}>
                <CFormInput 
                  placeholder="Court Name" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  label="Court Name"
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
              {/* <CCol md={2}>
                <CFormSelect
                  label="Type"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </CFormSelect>
              </CCol> */}
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
                <CButton color="primary" onClick={addCourt} className="px-4">Add Court</CButton>
              </CCol>
            </CForm>

            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">Court Name</CTableHeaderCell>
                  {/* <CTableHeaderCell scope="col">Type</CTableHeaderCell> */}
                  <CTableHeaderCell scope="col">Price (₹)</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {list.map(court => (
                  <CTableRow key={court._id}>
                    <CTableDataCell>{court.name}</CTableDataCell>
                    {/* <CTableDataCell>{court.type || 'Indoor'}</CTableDataCell> */}
                    <CTableDataCell>₹{court.price}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={court.status === 'Active' ? 'success' : 'danger'}>
                        {court.status || 'Active'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton 
                        color="info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => editCourt(court)}
                      >
                        Edit
                      </CButton>
                      <CButton 
                        color="danger" 
                        size="sm" 
                        onClick={() => removeCourt(court._id)}
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

      {/* Edit Court Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Edit Court</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput 
              label="Court Name"
              placeholder="Court Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
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
              label="Type"
              value={type}
              onChange={e => setType(e.target.value)}
              className="mb-3"
            >
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
            </CFormSelect>
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
          <CButton color="primary" onClick={updateCourt}>
            Save Changes
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  );
};

export default Courts;