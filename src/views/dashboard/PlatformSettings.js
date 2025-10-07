import React, { useEffect, useState } from 'react';
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
} from '@coreui/react';
import { Edit, Trash, Plus } from 'lucide-react';
import axiosInstance from '@/config/axiosInstance';
import { APIURL } from '@/config/const';
import Swal from 'sweetalert2';
import moment from 'moment/moment';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';

const PlatformSettingsManagement = () => {
  const [platformSettings, setPlatformSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Days of the week
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  // Default slot structures
  const defaultSlot = {
    start_time: '09:00',
    end_time: '13:00',
    is_active: true
  };

  const defaultQuickSlot = {
    start_time: '09:00',
    end_time: '21:00',
    is_active: true
  };

  // Default form state
  const defaultFormData = {
    delivery_time_slots: daysOfWeek.map(day => ({
      day,
      slots: [{ ...defaultSlot }]
    })),
    quick_delivery_time_slots: daysOfWeek.map(day => ({
      day,
      slots: [{ ...defaultQuickSlot }]
    }))
  };

  // Form state
  const [formData, setFormData] = useState({ ...defaultFormData });

  // Fetch platform settings data
  useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        const response = await axiosInstance.get(`${APIURL}platform-settings`);
        const data = response.data || [];

        // Ensure the response has the correct structure
        const formattedData = data.map(setting => {
          // Handle missing or malformed delivery_time_slots
          const deliverySlots = Array.isArray(setting.delivery_time_slots)
            ? setting.delivery_time_slots
            : daysOfWeek.map(day => ({
              day,
              slots: setting.delivery_time_slots?.[day] || [{ ...defaultSlot }]
            }));

          // Handle missing or malformed quick_delivery_time_slots
          const quickSlots = Array.isArray(setting.quick_delivery_time_slots)
            ? setting.quick_delivery_time_slots
            : daysOfWeek.map(day => ({
              day,
              slots: setting.quick_delivery_time_slots?.[day] || [{ ...defaultQuickSlot }]
            }));

          return {
            ...setting,
            delivery_time_slots: deliverySlots,
            quick_delivery_time_slots: quickSlots
          };
        });

        setPlatformSettings(formattedData);
      } catch (error) {
        console.error('Error fetching platform settings:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch platform settings. Please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformSettings();
  }, []);

  const paginationItemStyle = {
    cursor: 'pointer',
    ':hover': {
      cursor: 'pointer',
    },
  };

  // Pagination logic
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const currentSettings = platformSettings.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(platformSettings.length / recordsPerPage);

  // Handle Add Slots
  const handleAddSlots = () => {
    setFormData({ ...defaultFormData });
    setShowAddModal(true);
  };

  // Format time for display
  const formatTimeDisplay = (time) => {
    return moment(time, 'HH:mm').format('h:mm A');
  };

  // Parse time for storage
  const parseTimeInput = (timeString) => {
    return moment(timeString, 'h:mm A').format('HH:mm');
  };

  // Handle Time Change
  const handleTimeChange = (time, dayIndex, slotIndex, field, isQuickDelivery = false) => {
    const updatedData = { ...formData };
    const timeSlots = isQuickDelivery
      ? updatedData.quick_delivery_time_slots
      : updatedData.delivery_time_slots;

    timeSlots[dayIndex].slots[slotIndex][field] = time;
    setFormData(updatedData);
  };

  // Handle Add More Slots for a specific day
  const handleAddMoreSlots = (dayIndex, isQuickDelivery = false) => {
    const updatedData = { ...formData };
    const timeSlots = isQuickDelivery
      ? updatedData.quick_delivery_time_slots
      : updatedData.delivery_time_slots;

    timeSlots[dayIndex].slots.push({
      ...(isQuickDelivery ? defaultQuickSlot : defaultSlot)
    });
    setFormData(updatedData);
  };

  // Handle Remove Slot for a specific day
  const handleRemoveSlot = (dayIndex, slotIndex, isQuickDelivery = false) => {
    const updatedData = { ...formData };
    const timeSlots = isQuickDelivery
      ? updatedData.quick_delivery_time_slots
      : updatedData.delivery_time_slots;

    if (timeSlots[dayIndex].slots.length > 1) {
      timeSlots[dayIndex].slots.splice(slotIndex, 1);
      setFormData(updatedData);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot remove',
        text: 'Each day must have at least one time slot',
      });
    }
  };

  // Handle Toggle Active Status
  const handleToggleActive = (dayIndex, slotIndex, isQuickDelivery = false) => {
    const updatedData = { ...formData };
    const timeSlots = isQuickDelivery
      ? updatedData.quick_delivery_time_slots
      : updatedData.delivery_time_slots;

    timeSlots[dayIndex].slots[slotIndex].is_active =
      !timeSlots[dayIndex].slots[slotIndex].is_active;
    setFormData(updatedData);
  };

  // Handle Form Submission for Add
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post(`${APIURL}platform-settings`, formData);
      setPlatformSettings(prev => [...prev, response.data]);
      setShowAddModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Platform settings added successfully.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      
    } catch (error) {
      console.error('Error adding platform settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to add platform settings.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  // Handle Edit Button Click
  const handleEdit = async (id) => {
    try {
      const response = await axiosInstance.get(`${APIURL}platform-settings/${id}`);
      const setting = response.data;

      // Ensure the setting has the correct structure
      const formattedSetting = {
        ...setting,
        delivery_time_slots: setting.delivery_time_slots || daysOfWeek.map(day => ({
          day,
          slots: setting.delivery_time_slots?.[day] || [{ ...defaultSlot }]
        })),
        quick_delivery_time_slots: setting.quick_delivery_time_slots || daysOfWeek.map(day => ({
          day,
          slots: setting.quick_delivery_time_slots?.[day] || [{ ...defaultQuickSlot }]
        }))
      };

      setFormData(formattedSetting);
      setEditId(id);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching platform setting:', error);
      Swal.fire('Error', 'Failed to fetch platform setting.', 'error');
    }
  };

  // Handle Form Submission for Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.patch(`${APIURL}platform-settings/${editId}`, formData);
      const updatedSettings = platformSettings.map(setting =>
        setting._id === editId ? { ...setting, ...formData } : setting
      );
      setPlatformSettings(updatedSettings);
      setShowEditModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Platform settings updated successfully.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
          } catch (error) {
      console.error('Error updating platform settings:', error);
      Swal.fire('Error', 'Failed to update platform settings.', 'error');
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this platform setting!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`${APIURL}platform-settings/${id}`);
        setPlatformSettings(prev => prev.filter(setting => setting._id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The platform setting has been deleted.',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        
      } catch (error) {
        console.error('Error deleting platform setting:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to delete platform setting.',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        
      }
    }
  };

  // Get slots to render with fallbacks
  const deliverySlotsToRender = formData.delivery_time_slots || defaultFormData.delivery_time_slots;
  const quickSlotsToRender = formData.quick_delivery_time_slots || defaultFormData.quick_delivery_time_slots;

  const renderTimeSlotsForm = (slots, isQuickDelivery = false) => {
    return slots.map((day, dayIndex) => (
      <div key={dayIndex} className="mb-4">
        <h6>{day.day}</h6>
        {day.slots.map((slot, slotIndex) => (
          <div key={slotIndex} className="mb-3 p-3 border rounded position-relative">
            <CRow>
              <CCol md={5}>
                <CFormLabel>Start Time</CFormLabel>
                <TimePicker
                  value={slot.start_time}
                  onChange={(time) => handleTimeChange(time, dayIndex, slotIndex, 'start_time', isQuickDelivery)}
                  format="h:mm a"
                  clearIcon={null}
                  disableClock
                  className="w-100"
                  required
                />
              </CCol>
              <CCol md={5}>
                <CFormLabel>End Time</CFormLabel>
                <TimePicker
                  value={slot.end_time}
                  onChange={(time) => handleTimeChange(time, dayIndex, slotIndex, 'end_time', isQuickDelivery)}
                  format="h:mm a"
                  clearIcon={null}
                  disableClock
                  className="w-100"
                  required
                />
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <CFormCheck
                  type="checkbox"
                  label="Is Active"
                  checked={slot.is_active}
                  onChange={() => handleToggleActive(dayIndex, slotIndex, isQuickDelivery)}
                />
              </CCol>
            </CRow>
            <CButton
              color="danger"
              variant="ghost"
              className="position-absolute top-0 end-0 mt-2 me-2"
              onClick={() => handleRemoveSlot(dayIndex, slotIndex, isQuickDelivery)}
              title="Remove Slot"
              disabled={day.slots.length <= 1}
            >
              <Trash size={16} />
            </CButton>
          </div>
        ))}
        <CButton
          color="secondary"
          onClick={() => handleAddMoreSlots(dayIndex, isQuickDelivery)}
          className="mb-4"
        >
          Add More Slots for {day.day}
        </CButton>
      </div>
    ));
  };

  const renderTimeSlotsTable = (slots) => {
    return (
      <ul>
        {slots.map((day, dayIndex) => (
          <li key={dayIndex} style={{ marginBottom: '8px' }}>
            <strong>{day.day}:</strong>
            <ul style={{ listStyleType: 'disc', paddingLeft: '15px' }}>
              {day.slots.map((slot, slotIndex) => (
                <li
                  key={slotIndex}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    marginBottom: '8px',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    {formatTimeDisplay(slot.start_time)} - {formatTimeDisplay(slot.end_time)}
                  </span>
                  <span>
                    <CBadge color={slot.is_active ? 'success' : 'danger'}>
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </CBadge>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <CRow>
      <CCol xs={12}>
        {/* Add Slots Button */}
        <div className="d-flex justify-content-end mb-4">
          <CButton
            color="primary"
            onClick={handleAddSlots}
            className="px-4 py-2"
          >
            <Plus size={18} className="me-2" />
            Add Slots
          </CButton>
        </div>

        {/* Add Slots Modal */}
        <CModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          size="lg"
          backdrop="static"
          keyboard={true}
        >
          <CModalHeader closeButton>
            <CModalTitle>Add Platform Settings</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CForm onSubmit={handleSubmit}>
              <h4 className="mb-3 text-center">Normal Delivery Time Slots</h4>
              {renderTimeSlotsForm(deliverySlotsToRender)}

              <h4 className="mt-4 mb-3 text-center">Quick Delivery Time Slots</h4>
              {renderTimeSlotsForm(quickSlotsToRender, true)}

              <div className="d-flex justify-content-end mt-4">
                <CButton
                  color="secondary"
                  className="me-2"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </CButton>
                <CButton type="submit" color="primary">
                  Submit
                </CButton>
              </div>
            </CForm>
          </CModalBody>
        </CModal>

        {/* Edit Slots Modal */}
        <CModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          size="lg"
          backdrop="static"
          keyboard={true}
        >
          <CModalHeader closeButton>
            <CModalTitle>Edit Platform Settings</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CForm onSubmit={handleEditSubmit}>
              <h4 className="mb-3 text-center">Normal Delivery Time Slots</h4>
              {renderTimeSlotsForm(deliverySlotsToRender)}

              <h4 className="mt-4 mb-3 text-center">Quick Delivery Time Slots</h4>
              {renderTimeSlotsForm(quickSlotsToRender, true)}

              <div className="d-flex justify-content-end mt-4">
                <CButton
                  color="secondary"
                  className="me-2"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </CButton>
                <CButton type="submit" color="primary">
                  Update
                </CButton>
              </div>
            </CForm>
          </CModalBody>
        </CModal>

        {/* Platform Settings Table */}
        <CCard className="mb-4">
          <CCardHeader className="text-center bg-primary">
            <h5 className="text-white mb-0">Platform Settings Management</h5>
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="text-center p-5">
                <div className="text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : platformSettings.length === 0 ? (
              <div className="text-center py-3 text-danger fw-bold" style={{ fontSize: '20px' }}>
                No platform settings found
              </div>
            ) : (
              <>
                <CTable align="middle" bordered hover responsive className="mb-3">
                  <CTableHead className="bg-light">
                    <CTableRow>
                      <CTableHeaderCell className="text-center">Normal Delivery Time Slots</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Quick Delivery Time Slots</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {currentSettings.map((setting) => (
                      <CTableRow key={setting._id}>
                        <CTableDataCell className="text-center">
                          {renderTimeSlotsTable(setting.delivery_time_slots)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          {renderTimeSlotsTable(setting.quick_delivery_time_slots)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <CButton
                              color="primary"
                              variant="ghost"
                              onClick={() => handleEdit(setting._id)}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </CButton>
                            <CButton
                              color="danger"
                              variant="ghost"
                              onClick={() => handleDelete(setting._id)}
                              title="Delete"
                            >
                              <Trash size={18} />
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>

                {/* Pagination */}
                <CRow>
                  <CCol xs={12} className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">
                      Showing {firstIndex + 1} to {Math.min(lastIndex, platformSettings.length)} of {platformSettings.length} entries
                    </div>
                    <CPagination aria-label="Page navigation" className="mt-3" style={paginationItemStyle}>
                      <CPaginationItem
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </CPaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => (
                        <CPaginationItem
                          key={i + 1}
                          active={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </CPaginationItem>
                      ))}

                      <CPaginationItem
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </CPaginationItem>
                    </CPagination>
                  </CCol>
                </CRow>
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default PlatformSettingsManagement;
